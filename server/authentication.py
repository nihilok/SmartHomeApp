import time
from hashlib import md5
from fastapi import FastAPI, Depends, status, APIRouter
from starlette.exceptions import HTTPException
from starlette.requests import Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Optional
from utils import superusers
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from models import HouseholdMember, HouseholdMemberPydantic, HouseholdMemberPydanticIn

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='token')
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "SOMETHINGsEcReT!"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080
GUEST_IDS = [3]

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
)


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


def get_password_hash(password):
    return pwd_context.hash(password)


def verify_password(password, hash):
    return pwd_context.verify(password, hash)


async def authenticate_user(username: str, password: str) -> Optional[HouseholdMemberPydantic]:
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
    except Exception:
        return {'message': 'token expired, please log in again'}


async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = await HouseholdMemberPydantic.from_queryset_single(HouseholdMember.get(name=username))
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: HouseholdMember = Depends(get_current_user)):
    # current_user = await HouseholdMemberPydantic.from_queryset_single(HouseholdMember.get(id=current_user.id))
    if current_user.id in GUEST_IDS:
        raise credentials_exception
    return current_user


@router.post("/token/", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()) -> Token:
    print(form_data.username + ' logging in')
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
    return Token(access_token=access_token, token_type='bearer')


async def get_local_token():
    dt = datetime.now()
    monday = dt - timedelta(days=dt.weekday())
    pre_hash = "mjf" + monday.strftime('%Y-%m-%d') + "smarthome"
    return md5(pre_hash.encode('utf-8')).digest()


async def check_local_token(request: Request) -> bool:
    cookie_token = request.cookies.get('token')
    actual_token = str(await get_local_token())
    print(f'''
    cookie token: {cookie_token}
    actual token: {actual_token}
    ''')
    if request.cookies.get('token') == str(await get_local_token()):
        return True


@router.post('/check_token/')
async def check_token(token: Token) -> Token:
    if token.access_token.startswith('"'):
        token.access_token = token.access_token[1:-1]
    user = await get_current_user(token.access_token)
    if user:
        return token


# @router.post('/check_ip')
# async def check_ip(request: Request, response: Response):
#     host_ip = request.client.host
#     if host_ip == PUBLIC_IP:
#         token = str(await get_local_token())
#         response.set_cookie(key="token", value=token, max_age=604800)
#         return token
#     elif await check_local_token(request):
#         return request.cookies.get('token')


@router.post('/check_superuser/')
async def check_superuser(user: HouseholdMemberPydantic =
                          Depends(get_current_user)) -> Optional[HouseholdMemberPydantic]:
    if user.id in superusers:
        return user


@router.post('/users/')
async def create_user(user: HouseholdMemberPydanticIn,
                      superuser: HouseholdMemberPydantic = Depends(check_superuser)):
    if superuser:
        user_obj = HouseholdMember(name=user.name, password_hash=get_password_hash(user.password_hash))
        await user_obj.save()
        return await HouseholdMemberPydantic.from_tortoise_orm(user_obj)
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You need to be a superuser to create another user.",
        )
