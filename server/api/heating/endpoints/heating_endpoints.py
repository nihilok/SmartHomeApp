from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

import requests
from fastapi import Depends, APIRouter
from pydantic import BaseModel
import urllib.parse as urlparse

from ...auth.authentication import get_current_active_user
from ...cache.redis_funcs import get_weather, set_weather
from ...db.models import HouseholdMemberPydantic
from ...server import TESTING
from ...utils.concurrent_calls import urls, get_data

if not TESTING:
    from ..central_heating import HeatingSystem, HeatingConf
else:
    from ..central_heating import HeatingConf


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

hs = HeatingSystem()
router = APIRouter()

class WeatherReport(BaseModel):
    # keys = ['dt', 'sunrise', 'sunset', 'temp', 'feels_like', 'pressure', 'humidity', 'dew_point', 'uvi', 'clouds',
    #         'visibility', 'wind_speed', 'wind_deg', 'weather']
    current: dict
    daily: List[dict]


class ApiInfo(BaseModel):
    indoor_temp: str
    outdoor_temp: str = '- -' + '°C'
    weather: str = '- -'
    last_updated: str = '--:--:--'
    on: bool = hs.check_state()
    program_on: bool = hs.conf.program_on
    ip: Optional[str] = None


@router.get('/weather/')
async def weather() -> WeatherReport:
    weather_dict = await get_weather()
    if not weather_dict:
        url = urls['weather']
        r = requests.get(url).json()
        weather_dict = {'current': r['current'], 'daily': r['daily']}
        await set_weather(weather_dict)
    return WeatherReport(**weather_dict)


# Central heating endpoints
@router.get('/heating/info/', response_model=ApiInfo)
async def api():
    out = get_data()
    temp_url = urlparse.urlparse(urls['temperature']).netloc + urlparse.urlparse(urls['temperature']).path
    ip_url = urlparse.urlparse(urls['ip']).netloc + urlparse.urlparse(urls['ip']).path
    weather_report = await weather()
    print(datetime.fromtimestamp(weather_report.current['dt']).strftime('%H:%M:%S'))
    return ApiInfo(indoor_temp=str('{0:.1f}'.format(out[temp_url][0]['temperature'])) + '°C',
                   outdoor_temp=str('{0:.1f}'.format(weather_report.current['temp'])) + '°C',
                   weather=weather_report.current['weather'][0]['description'],
                   last_updated=datetime.fromtimestamp(weather_report.current['dt']).strftime('%H:%M'),
                   on=hs.check_state(),
                   program_on=hs.conf.program_on,
                   ip=out[ip_url][0]['ip'])


@router.get('/heating/info/temperature/', response_model=ApiInfo)
async def temp_only():
    r = requests.get(urls['temperature'])
    return ApiInfo(indoor_temp=str('{0:.1f}'.format(r.json()['temperature'])) + '°C',
                   on=hs.check_state(),
                   program_on=hs.conf.program_on)


@router.get('/heating/conf/')
async def heating():
    return hs.conf


@router.post('/heating/')
async def heating_conf(conf: HeatingConf,
                       user: HouseholdMemberPydantic = Depends(get_current_active_user)) -> HeatingConf:
    if hs.conf != conf:
        hs.conf.__dict__.update(**conf.dict(exclude_unset=True))
        hs.save_state()
        hs.main_loop()
    return await heating()


@router.get('/heating/on_off/')
async def heating_on_off(user: HouseholdMemberPydantic = Depends(get_current_active_user)):
    if not hs.conf.program_on:
        hs.program_on()
    else:
        hs.program_off()
    return await heating()