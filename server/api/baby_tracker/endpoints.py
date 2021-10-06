from typing import List

from fastapi import Depends, APIRouter

from .models import FeedPydantic, FeedPydanticIn, ChangePydantic, ChangePydanticIn, Feed, Change

router = APIRouter()


@router.get('/baby/feed/', response_model=List[FeedPydantic])
async def get_feeds():
    """return data about feeds"""
    return await FeedPydantic.from_queryset(Feed.all())


@router.post('/baby/feed/', response_model=FeedPydantic)
async def new_feed(feed: FeedPydanticIn):
    """create a new feed record"""
    current_feed = await Feed.create(**feed.dict(exclude_unset=True))
    return await FeedPydantic.from_tortoise_orm(current_feed)


@router.get('/baby/change/', response_model=List[ChangePydantic])
async def get_changes():
    """return data about changes"""
    return await ChangePydantic.from_queryset(Change.all())


@router.post('/baby/change/', response_model=ChangePydantic)
async def new_change(change: ChangePydanticIn):
    """create a new change record"""
    current_change = await Change.create(**change.dict(exclude_unset=True))
    return await ChangePydantic.from_tortoise_orm(current_change)
