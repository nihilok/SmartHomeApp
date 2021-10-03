import base64
import pickle
from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ...auth.authentication import get_current_active_user
from ...db.models import HouseholdMemberPydantic, Household, HouseholdMember

router = APIRouter(prefix='/planner')


class AgendaItem(BaseModel):
    description: str
    time: Optional[int] = None
    created: datetime = datetime.utcnow().timestamp()


class Day(BaseModel):
    items: List[AgendaItem] = []
    date: date


class Week(BaseModel):
    days: dict = {}

    async def create_week(self):
        for i in range(7):
            self.days[(datetime.now()+timedelta(days=i)).date()] = Day(date=(datetime.now()+timedelta(days=i)))

    async def shift_days(self):
        for date_key in self.days.copy().keys():
            if date_key <= (datetime.now() - timedelta(days=1)).date():
                del self.days[date_key]
        week_left = len(self.days)
        if week_left:
            for i in range(week_left, 7):
                self.days[(datetime.now() + timedelta(days=i)).date()] = Day(date=(datetime.now() + timedelta(days=i)))
        else:
            return await self.create_week()


async def get_or_create_week(user: HouseholdMemberPydantic) -> Week:
    user = await HouseholdMember.get(id=user.id)
    hh = await Household.get(id=user.household_id)
    if not hh.week:
        week = Week()
        hh.week = pickle.dumps(week)
        await week.create_week()
    else:
        week = pickle.loads(hh.week)
    await hh.save()
    return week


async def save_week(week: Week, user: HouseholdMemberPydantic):
    user = await HouseholdMember.get(id=user.id)
    hh = await Household.get(id=user.household_id)
    hh.week = pickle.dumps(week)
    await hh.save()


@router.get('/this-week/', response_model=Week)
async def get_week(user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    w = await get_or_create_week(user)
    for d in w.days.keys():
        if d < datetime.now().date():
            await w.shift_days()
            await save_week(w, user)
            break
    return await get_or_create_week(user)


async def shift_week(user: HouseholdMemberPydantic):
    w = await get_or_create_week(user)
    await w.shift_days()
    return w


@router.post('/add-item/{date_key}/')
async def add_item(
        item: AgendaItem,
        date_key: date,
        user: HouseholdMemberPydantic = Depends(get_current_active_user)
):
    week = await get_or_create_week(user)
    item = AgendaItem(**item.dict(exclude_unset=True))
    week.days[date_key].items.append(item)
    await save_week(week, user)
    return week


@router.delete('/{date_key}/{item_description}/')
async def delete_item(
        date_key: date,
        item_description: bytes,
        user: HouseholdMemberPydantic = Depends(get_current_active_user)
):
    item_description = base64.b64decode(item_description).decode('utf-8')
    week = await get_or_create_week(user)
    for item in week.days[date_key].items:
        if item.description == item_description:
            week.days[date_key].items.remove(item)
            break
    await save_week(week, user)
    return week
