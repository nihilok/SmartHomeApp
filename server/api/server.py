import os
from typing import Optional, List
from .cache.redis_funcs import set_weather, get_weather
import requests
from dataclasses import dataclass
from fastapi import FastAPI, Depends, status
from tortoise.contrib.fastapi import register_tortoise
from fastapi.middleware.cors import CORSMiddleware
import urllib.parse as urlparse
from . import authentication
from .authentication import get_current_user, get_current_active_user
from pydantic import BaseModel
from .db.models import Task, TaskPydantic, TaskPydanticIn, \
    ShoppingListItem, ShoppingListItemPydantic, ShoppingListItemPydanticIn, \
    Recipe, RecipePydantic, RecipePydanticIn, \
    HouseholdMember, HouseholdMemberPydantic
from .utils.concurrent_calls import get_data, urls

TESTING = False

app = FastAPI()
app.include_router(authentication.router)

origins = [
    'https://example.com',
    'http://localhost:4000',
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not TESTING:
    from .heating.central_heating import HeatingSystem, HeatingConf
else:
    from .heating.central_heating import HeatingConf


    @dataclass
    class HeatingSystem:
        conf = HeatingConf(
            target="20",
            on_1="08:30",
            off_1="10:30",
            on_2="18:30",
            off_2="22:30",
            program_on=True
        )

        def check_state(self):
            return self.conf.program_on

        def program_on(self):
            self.conf.program_on = True

        def program_off(self):
            self.conf.program_on = False


    origins += ['*']

hs = HeatingSystem()


class WeatherReport(BaseModel):
    # keys = ['dt', 'sunrise', 'sunset', 'temp', 'feels_like', 'pressure', 'humidity', 'dew_point', 'uvi', 'clouds',
    #         'visibility', 'wind_speed', 'wind_deg', 'weather']
    current: dict
    daily: List[dict]


class ApiInfo(BaseModel):
    indoor_temp: str
    outdoor_temp: str = '- -' + '°C'
    weather: str = '- -'
    on: bool = hs.check_state()
    program_on: bool = hs.conf.program_on
    ip: Optional[str] = None


@app.get('/weather/')
async def weather() -> WeatherReport:
    weather_dict = await get_weather()
    if not weather_dict:
        url = urls['weather']
        r = requests.get(url).json()
        weather_dict = {'current': r['current'], 'daily': r['daily']}
        await set_weather(weather_dict)
    return WeatherReport(**weather_dict)


# Central heating endpoints
@app.get('/heating/info/', response_model=ApiInfo)
async def api():
    out = get_data()
    temp_url = urlparse.urlparse(urls['temperature']).netloc + urlparse.urlparse(urls['temperature']).path
    ip_url = urlparse.urlparse(urls['ip']).netloc + urlparse.urlparse(urls['ip']).path
    weather_report = await weather()
    return ApiInfo(indoor_temp=str('{0:.1f}'.format(out[temp_url][0]['temperature'])) + '°C',
                   outdoor_temp=str('{0:.1f}'.format(weather_report.current['temp'])) + '°C',
                   weather=weather_report.current['weather'][0]['description'],
                   on=hs.check_state(),
                   program_on=hs.conf.program_on,
                   ip=out[ip_url][0]['ip'])


@app.get('/heating/info/temperature/', response_model=ApiInfo)
async def temp_only():
    r = requests.get(urls['temperature'])
    return ApiInfo(indoor_temp=str('{0:.1f}'.format(r.json()['temperature'])) + '°C',
                   on=hs.check_state(),
                   program_on=hs.conf.program_on)


@app.get('/heating/conf/')
async def heating():
    return hs.conf


@app.post('/heating/')
async def heating_conf(conf: HeatingConf,
                       user: HouseholdMemberPydantic = Depends(get_current_active_user)) -> HeatingConf:
    if hs.conf != conf:
        hs.conf.__dict__.update(**conf.dict(exclude_unset=True))
        hs.save_state()
        hs.main_loop()
    return await heating()


@app.get('/heating/on_off/')
async def heating_on_off(user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    if not hs.conf.program_on:
        hs.program_on()
    else:
        hs.program_off()
    return await heating()


class TaskResponseSingle(BaseModel):
    id: int
    name: str
    task: str


class TasksResponse(BaseModel):
    names: List[tuple]
    tasks: List[TaskResponseSingle]


# Tasks endpoints
async def parse_tasks() -> TasksResponse:
    tasks = await Task.all()
    hms = await HouseholdMember.all()
    names = dict(zip([hm.id for hm in hms if hm.id not in authentication.GUEST_IDS], [(hm.id, hm.name) for hm in hms]))
    resp = []
    for task in tasks:
        resp.append(TaskResponseSingle(id=task.id, name=names[task.hm_id][1], task=task.task))
    return TasksResponse(names=list(names.values()), tasks=resp)


@app.get('/tasks/')
async def get_tasks(user: HouseholdMemberPydantic = Depends(get_current_user)):
    return await parse_tasks()


@app.post('/tasks/')
async def add_task(task: TaskPydanticIn, user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    await Task.create(**task.dict(exclude_unset=True))
    return await parse_tasks()


@app.delete('/tasks/{id}/')
async def delete_task(id: int, user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    await Task.filter(id=id).delete()
    return await get_tasks()


# Shopping list endpoints
@app.get('/shopping/')
async def get_shopping_list():
    return await ShoppingListItemPydantic.from_queryset(ShoppingListItem.all().order_by('id'))


@app.post('/shopping/')
async def add_shopping_item(item: ShoppingListItemPydanticIn,
                            user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    try:
        await ShoppingListItem.create(**item.dict(exclude_unset=True))
    finally:
        return await get_shopping_list()


@app.delete('/shopping/{item_id}/')
async def delete_shopping_item(item_id: int, user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    await ShoppingListItem.filter(id=item_id).delete()
    return await get_shopping_list()


# Recipe endpoints
@app.get('/recipes/')
async def get_recipes():
    return await RecipePydantic.from_queryset(Recipe.all())


@app.post('/recipes/')
async def add_recipe(recipe: RecipePydanticIn, user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    await Recipe.create(**recipe.dict(exclude_unset=True))
    return await get_recipes()


@app.get('/recipes/{recipe_id}/')
async def get_recipe(recipe_id: int, user: HouseholdMemberPydantic = Depends(get_current_user)):
    return await RecipePydantic.from_queryset_single(Recipe.get(id=recipe_id))


@app.post('/recipes/{recipe_id}/')
async def edit_recipe(recipe_id: int, new_recipe: RecipePydanticIn,
                      current_user: HouseholdMember = Depends(get_current_active_user)):
    recipe = await Recipe.get(id=recipe_id)
    recipe.meal_name, recipe.ingredients, recipe.notes = new_recipe.meal_name, new_recipe.ingredients, new_recipe.notes
    await recipe.save()
    return await get_recipes()


@app.delete('/recipes/{recipe_id}/')
async def delete_recipe(recipe_id: int, user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    await Recipe.filter(id=recipe_id).delete()
    return await get_recipes()


# Register tortoise models
register_tortoise(
    app,
    db_url=f'sqlite://{os.path.abspath(os.getcwd())}/api/db/db.sqlite3',
    modules={'models': ['api.db.models']},
    generate_schemas=True,
    add_exception_handlers=True
)
