import os
from fastapi import FastAPI
from tortoise import Tortoise
from tortoise.contrib.fastapi import register_tortoise
from fastapi.middleware.cors import CORSMiddleware
from .constants import origins
from ..auth import authentication
from ..db.endpoints import crud_endpoints
from ..heating.endpoints import heating_endpoints
from ..planner.endpoints import planner_endpoints


# Create ASGI app:
app = FastAPI()
app.include_router(authentication.router)
app.include_router(heating_endpoints.router)
app.include_router(crud_endpoints.router)
app.include_router(planner_endpoints.router)


# CORS Permissions:
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register tortoise-orm models:
Tortoise.init_models(["api.db.models"], "models")


register_tortoise(
    app,
    db_url=f'sqlite://{os.path.abspath(os.getcwd())}/api/db/db.sqlite3',
    modules={'models': ['api.db.models']},
    generate_schemas=True,
    add_exception_handlers=True
)

