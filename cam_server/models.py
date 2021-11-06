import os
from passlib.context import CryptContext
from tortoise import fields, Tortoise
from tortoise.models import Model
from tortoise.contrib.pydantic import pydantic_model_creator


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
REACT_IMAGE_PATH = os.path.join('assets', 'portfolio_images')
PYTHON_IMAGE_PATH = os.path.join('..', 'build', 'assets', 'portfolio_images')


class User(Model):
    user_id = fields.IntField(pk=True)
    username = fields.CharField(30)
    password_hash = fields.CharField(255)

    @classmethod
    async def get_user(cls, name, **kwargs):
        return cls.get(username=name)

    def verify_password(self, password):
        return pwd_context.verify(password, self.password_hash)


UserPydantic = pydantic_model_creator(User, name="User")
UserPydanticIn = pydantic_model_creator(User, name="UserIn", exclude_readonly=True)