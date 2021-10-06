from tortoise import fields
from tortoise.models import Model
from tortoise.contrib.pydantic import pydantic_model_creator

from ..heating.custom_datetimes import BritishTime


class Feed(Model):
    id = fields.IntField(pk=True)
    start_time = fields.DatetimeField()
    end_time = fields.DatetimeField()
    notes = fields.TextField(null=True, blank=True)


class Change(Model):
    id = fields.IntField(pk=True)
    timestamp = fields.DatetimeField()
    notes = fields.TextField(null=True, blank=True)


FeedPydantic = pydantic_model_creator(Feed, name='Feed')
FeedPydanticIn = pydantic_model_creator(Feed, name='FeedIn', exclude_readonly=True)
ChangePydantic = pydantic_model_creator(Change, name='Change')
ChangePydanticIn = pydantic_model_creator(Change, name='ChangeIn', exclude_readonly=True)
