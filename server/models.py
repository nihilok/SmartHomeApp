from passlib.context import CryptContext
from pydantic import BaseModel
from tortoise import fields
from tortoise.models import Model
from tortoise.contrib.pydantic import pydantic_model_creator

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class HouseholdMember(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(100, unique=True)
    password_hash = fields.CharField(128)

    @classmethod
    async def get_user(cls, name, **kwargs):
        return cls.get(name=name)

    def verify_password(self, password):
        return pwd_context.verify(password, self.password_hash)


HouseholdMemberPydantic = pydantic_model_creator(HouseholdMember, name='HouseholdMember')
HouseholdMemberPydanticIn = pydantic_model_creator(HouseholdMember, name='HouseholdMemberIn', exclude_readonly=True)


class Task(Model):
    id = fields.IntField(pk=True)
    task = fields.CharField(255)
    hm = fields.ForeignKeyField('models.HouseholdMember', related_name='tasks')

    class Meta:
        unique_together = ("hm_id", "task")


TaskPydantic = pydantic_model_creator(Task, name='Task')


class TaskPydanticIn(BaseModel):
    hm_id: int
    task: str


class ShoppingListItem(Model):
    id = fields.IntField(pk=True)
    item_name = fields.CharField(100, unique=True)


ShoppingListItemPydantic = pydantic_model_creator(ShoppingListItem, name='ShoppingListItem')
ShoppingListItemPydanticIn = pydantic_model_creator(ShoppingListItem, name='ShoppingListItemIn', exclude_readonly=True)


class Recipe(Model):
    id = fields.IntField(pk=True)
    meal_name = fields.CharField(100, unique=True)
    ingredients = fields.CharField(255)
    notes = fields.CharField(255, null=True)


RecipePydantic = pydantic_model_creator(Recipe, name='Recipe')
RecipePydanticIn = pydantic_model_creator(Recipe, name='RecipeIn', exclude_readonly=True)
