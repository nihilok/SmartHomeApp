import concurrent.futures
import json
import time
from hashlib import md5
import uvicorn
import requests
from fastapi import FastAPI, Depends, status
from starlette.exceptions import HTTPException
from starlette.requests import Request
from starlette.responses import Response
from tortoise.contrib.fastapi import register_tortoise
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import urllib.parse as urlparse
from datetime import datetime, timedelta
from typing import Optional
from typing_extensions import TypedDict
from fastapi.encoders import jsonable_encoder

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from models import Task, TaskPydantic, TaskPydanticIn, \
    ShoppingListItem, ShoppingListItemPydantic, ShoppingListItemPydanticIn, \
    Recipe, RecipePydantic, RecipePydanticIn, \
    HouseholdMember, HouseholdMemberPydantic, HouseholdMemberPydanticIn

TESTING = False
SECRET_KEY = "arandomstringofcharacters"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='token')
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

origins = [
    '*'
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not TESTING:
    from central_heating import HeatingSystem, HeatingConf

    PUBLIC_IP = 'YOUR PUBLIC IP' # new user can only be created from host IP address.
else:
    class HeatingSystem:
        conf = {}

        @staticmethod
        def check_state():
            return True


    origins += ['*']
    PUBLIC_IP = '127.0.0.1'

hs = HeatingSystem()


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


def get_password_hash(password):
    return pwd_context.hash(password)


def verify_password(password, hash):
    return pwd_context.verify(password, hash)


async def authenticate_user(username: str, password: str):
    user = await HouseholdMemberPydantic.from_queryset_single(HouseholdMember.get(name=username))
    try:
        if not verify_password(password, user.password_hash):
            return False
        return user
    except:
        return None


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_jwt(token: str) -> dict:
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return decoded_token if decoded_token["expires"] >= time.time() else None
    except:
        return {}


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = HouseholdMember.get_user(name=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: HouseholdMember = Depends(get_current_user)):
    current_user = HouseholdMemberPydantic.from_queryset_single(HouseholdMember.get(id=current_user.id))
    # if current_user.disabled:
    #     raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.name}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


async def get_local_token():
    dt = datetime.now()
    monday = dt - timedelta(days=dt.weekday())
    pre_hash = "mjf" + monday.strftime('%Y-%m-%d') + "smarthome"
    return md5(pre_hash.encode('utf-8')).digest()


async def check_local_token(request: Request):
    cookie_token = request.cookies.get('token')
    actual_token = str(await get_local_token())
    print(f'''
    cookie token: {cookie_token}
    actual token: {actual_token}
    ''')
    if request.cookies.get('token') == str(await get_local_token()):
        return True


@app.post('/check_ip')
async def check_ip(request: Request, response: Response):
    host_ip = request.client.host
    if host_ip == PUBLIC_IP:
        token = str(await get_local_token())
        response.set_cookie(key="token", value=token, max_age=604800)
        return token
    elif await check_local_token(request):
        return request.cookies.get('token')


@app.post('/users')
async def create_user(user: HouseholdMemberPydanticIn, local_auth: str = Depends(check_ip)):
    if local_auth:
        user_obj = HouseholdMember(name=user.name, password_hash=get_password_hash(user.password_hash))
        await user_obj.save()
        return await HouseholdMemberPydantic.from_tortoise_orm(user_obj)
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect location",
        )


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
@app.get('/heating/info/')
async def api():
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


@app.get('/heating/conf/')
async def heating():
    return hs.conf


@app.post('/heating/')
async def heating_conf(conf: HeatingConf):
    if hs.conf != conf:
        hs.conf.__dict__.update(**conf.dict(exclude_unset=True))
        hs.save_state()
        hs.main_loop()
    return hs.conf


# Tasks endpoints
async def parse_tasks():
    resp = {
        'Les': [],
        'Mike': []
    }
    for task in await TaskPydantic.from_queryset(Task.all()):
        if task.name == 'Les':
            resp['Les'].append((task.id, task.task))
        elif task.name == 'Mike':
            resp['Mike'].append((task.id, task.task))
    return resp


@app.get('/tasks')
async def get_tasks():
    return await parse_tasks()


@app.post('/tasks')
async def add_task(task: TaskPydanticIn):
    await Task.create(**task.dict(exclude_unset=True))
    return await parse_tasks()


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
    try:
        await ShoppingListItem.create(**item.dict(exclude_unset=True))
    finally:
        return await get_shopping_list()


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
async def edit_recipe(recipe_id: int, new_recipe: RecipePydanticIn,
                      current_user: HouseholdMember = Depends(get_current_user)):
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

if __name__ == '__main':
    uvicorn.run(app, port=8000)
