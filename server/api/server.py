import os
from fastapi import FastAPI, Depends
from tortoise.contrib.fastapi import register_tortoise
from fastapi.middleware.cors import CORSMiddleware
from .auth import authentication
from .db.endpoints import crud_endpoints
from .auth.constants import origins
from .heating.endpoints import heating_endpoints


TESTING = True      # Uses benign heating system when True
# API will fail if no heating system in place when False


# Create ASGI app:
app = FastAPI()
app.include_router(authentication.router)
app.include_router(heating_endpoints.router)
app.include_router(crud_endpoints.router)


# CORS Permissions:
if TESTING:
    origins += ['*']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register tortoise-orm models:
register_tortoise(
    app,
    db_url=f'sqlite://{os.path.abspath(os.getcwd())}/api/db/db.sqlite3',
    modules={'models': ['api.db.models']},
    generate_schemas=True,
    add_exception_handlers=True
)
