import pickle
from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ...auth.authentication import get_current_active_user
from ...db.models import HouseholdMemberPydantic, Household, HouseholdMember

router = APIRouter(prefix='/planner')


class AgendaItem(BaseModel):
    description: str
    time: Optional[int] = None


class Day(BaseModel):
    items: List[AgendaItem] = []
    date: date


class Week(BaseModel):
    days: dict = {}

    async def create_week(self):
        for i in range(7):
            self.days[(datetime.now()+timedelta(days=i)).date()] = Day(date=(datetime.now()+timedelta(days=i)))

    async def shift_days(self):
        del self.days[(datetime.now() - timedelta(days=1)).date()]
        self.days[(datetime.now() + timedelta(days=6)).date()] = Day(date=(datetime.now() + timedelta(days=6)))


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


async def shift_week(week: Week, user: HouseholdMemberPydantic):
    w = await get_or_create_week(user)
    await w.shift_days()
    return w


@router.post('/add-item/{date}/')
async def add_item(item: AgendaItem, date: date, user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    week = await get_or_create_week(user)
    item = AgendaItem(**item.dict(exclude_unset=True))
    week.days[date].items.append(item)
    await save_week(week, user)
    return week


@router.delete('/{date}/{item_description}')
async def delete_item(date: date, item_description: str, user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    week = await get_or_create_week(user)
    for item in week.days[date].items:
        if item.description == item_description:
            week.days[date].items.remove(item)
            break
    await save_week(week, user)
    return week

