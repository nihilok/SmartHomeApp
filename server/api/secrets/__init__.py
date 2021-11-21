import configparser
import os
from pathlib import Path

from fastapi import APIRouter, Depends

from ..auth.authentication import get_current_active_user
from ..db.models import HouseholdMember

config = configparser.ConfigParser()
path = Path(__file__)
ROOT_DIR = path.parent.absolute()
config_path = os.path.join(ROOT_DIR, "secrets.ini")
config.read(config_path)

router = APIRouter(prefix='/secrets')


@router.get('/telegram-bot-token/')
async def get_telegram_bot_token(user: HouseholdMember = Depends(get_current_active_user)):
    return {'token': config['TELEGRAM_BOT']['BOT_TOKEN'], 'channel': config['TELEGRAM_BOT']['CHANNEL_ID']}
