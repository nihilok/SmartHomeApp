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
    days: List[Day] = []

    async def create_week(self):
        for i in range(7):
            self.days.append(Day(date=(datetime.now()+timedelta(days=i))))

    async def shift_days(self):
        for i in range(len(self.days)-1):
            self.days[i] = self.days[i+1]
        self.days[-1] = Day(date=(datetime.now()+timedelta(days=7)))



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
    return await get_or_create_week(user)


async def shift_week(week: Week, user: HouseholdMemberPydantic):
    w = await get_or_create_week(user)
    await w.shift_days()
    return w


@router.post('/add-item/{date}/')
async def add_item(item: AgendaItem, date: date, user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    week = await get_or_create_week(user)
    item = AgendaItem(**item.dict(exclude_unset=True))
    week.days[(date - datetime.now().date()).days].items.append(item)
    await save_week(week, user)
    return week


@router.delete('/{date}/{item_description}')
async def delete_item(date: date, item_description: str, user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    week = await get_or_create_week(user)
    for item in week.days[(date - datetime.now().date()).days].items:
        if item.description == item_description:
            week.days[(date - datetime.now().date()).days].items.remove(item)
            break
    await save_week(week, user)
    return week