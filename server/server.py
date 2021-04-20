import concurrent.futures
import json
import uvicorn
import requests
from fastapi import FastAPI, Depends
from tortoise.contrib.fastapi import register_tortoise
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.hash import bcrypt
import urllib.parse as urlparse

from models import Task, TaskPydantic, TaskPydanticIn, \
    ShoppingListItem, ShoppingListItemPydantic, ShoppingListItemPydanticIn, \
    Recipe, RecipePydantic, RecipePydanticIn, \
    HouseholdMember, HouseholdMemberPydantic, HouseholdMemberPydanticIn

from central_heating import HeatingSystem
from utils import parse_tasks

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='token')
origins = [
    "http://127.0.0.1:4000",
    "http://localhost:4000",
    "http://localhost",
    "https://smarthome.mjfullstack.com",
    '*'
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

hs = HeatingSystem()

CONNECTIONS = 100
TIMEOUT = 5
urls = ['https://api.smarthome.mjfullstack.com',
        'http://api.ipstack.com/check?access_key=cbcc8b556db35ab071f29e75d7ae32f6&output=json&fields=ip',
        'https://api.openweathermap.org/data/2.5/onecall?lat=51.6862&lon=-1.4129&exclude=minutely,hourly'
        '&units=metric&appid=9fa343773117603702a3f91a62e14ee4']


def decode_json(data):
    if data.startswith('{'):
        data = json.loads(data)
    return data


def load_url(url, timeout):
    ans = requests.get(url, timeout=timeout)
    return url, decode_json(ans.text)


def get_data():
    out = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONNECTIONS) as executor:
        future_to_url = (executor.submit(load_url, url, TIMEOUT) for url in urls)
        for future in concurrent.futures.as_completed(future_to_url):
            try:
                data = future.result()
            except Exception as exc:
                data = ('error', str(type(exc)))
            finally:
                out[urlparse.urlparse(data[0]).netloc] = [data[1]]
    return out


# Central heating endpoints
@app.get('/heating/info')
def api():
    out = get_data()
    temp_url = urlparse.urlparse(urls[0]).netloc
    ip_url = urlparse.urlparse(urls[1]).netloc
    weather_url = urlparse.urlparse(urls[2]).netloc
    try:
        info = {
            'indoor_temp': str('{0:.1f}'.format(out[temp_url][0]['temperature'])) + '°C',
            'outdoor_temp': str(out[weather_url][0]['current']['temp']) + '°C',
            'weather': out[weather_url][0]['current']['weather'][0]['description'],
            'on': True if hs.check_state() else False,
        }
    except KeyError:
        info = {
            'indoor_temp': str('{0:.1f}'.format(out[temp_url][0]['temperature'])) + '°C',
            'outdoor_temp': '- -' + '°C',
            'weather': '- -',
            'on': True if hs.check_state() else False,
        }
    try:
        info['external_ip'] = out[ip_url][0]['ip']
    except KeyError:
        info['external_ip'] = None
    return info


@app.get('/heating/conf')
async def heating():
    return hs.conf


@app.post('/heating')
async def heating_conf(conf: dict):
    if hs.conf != conf['form']:
        for key in conf['form'].keys():
            hs.conf[key] = conf['form'][key]
        hs.save_state()
    return hs.conf


# Tasks endpoints
@app.get('/tasks')
async def get_tasks():
    return await parse_tasks()


@app.post('/tasks')
async def add_task(task: TaskPydanticIn):
    print(task)
    await Task.create(**task.dict(exclude_unset=True))
    return await parse_tasks()


@app.get('/tasks/{task_id}')
async def get_task(task_id: int):
    return await TaskPydantic.from_queryset_single(Task.get(id=task_id))


@app.delete('/tasks/{task_id}')
async def delete_task(task_id: int):
    await Task.filter(id=task_id).delete()
    return await get_tasks()


# Shopping list endpoints
@app.get('/shopping')
async def get_shopping_list():
    return await ShoppingListItemPydantic.from_queryset(ShoppingListItem.all().order_by('-id'))


@app.post('/shopping')
async def add_shopping_item(item: ShoppingListItemPydanticIn):
    print(item)
    try:
        await ShoppingListItem.create(**item.dict(exclude_unset=True))
    finally:
        return await get_shopping_list()


@app.get('/shopping/{item_id}')
async def get_shopping_item(item_id: int):
    return await ShoppingListItemPydantic.from_queryset_single(ShoppingListItem.get(id=item_id))


@app.delete('/shopping/{item_id}')
async def delete_shopping_item(item_id: int):
    await ShoppingListItem.filter(id=item_id).delete()
    return await get_shopping_list()


# Recipe endpoints
@app.get('/recipes')
async def get_recipes():
    return await RecipePydantic.from_queryset(Recipe.all())


@app.post('/recipes')
async def add_recipe(recipe: RecipePydanticIn):
    task_obj = await Recipe.create(**recipe.dict(exclude_unset=True))
    return await RecipePydantic.from_tortoise_orm(task_obj)


@app.get('/recipes/{recipe_id}')
async def get_recipe(recipe_id: int):
    return await RecipePydantic.from_queryset_single(Recipe.get(id=recipe_id))


@app.post('/recipe/{recipe_id}')
async def edit_recipe(recipe_id: int, new_recipe: RecipePydanticIn):
    recipe = await ShoppingListItem.get(id=recipe_id)
    print(new_recipe)
    recipe.meal_name, recipe.ingredients, recipe.notes = new_recipe.meal_name, new_recipe.ingredients, new_recipe.notes
    await recipe.save()
    return await ShoppingListItemPydantic.from_queryset_single(recipe)


@app.delete('/recipes/{recipe_id}')
async def delete_recipe(recipe_id: int):
    await Recipe.filter(id=recipe_id).delete()
    return {}


# Register tortoise models
register_tortoise(
    app,
    db_url='sqlite://db.sqlite3',
    modules={'models': ['models']},
    generate_schemas=True,
    add_exception_handlers=True
)


# Test endpoints
@app.post('/token')
async def token(form_data: OAuth2PasswordRequestForm = Depends()):
    return {'access_token': form_data.username + 'token'}


@app.get('/')
async def index(token: str = Depends(oauth2_scheme)):
    return {'token': token}


@app.post('/users')
async def create_user(user: HouseholdMemberPydanticIn):
    user_obj = HouseholdMember(name=user.name, password_hash=bcrypt.hash(user.password_hash))
    await user_obj.save()
    return await HouseholdMemberPydantic.from_tortoise_orm(user_obj)

if __name__ == '__main':
    uvicorn.run(app, port=8000)