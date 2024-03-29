from dataclasses import dataclass
from typing import List, Optional

from fastapi import Depends, APIRouter
from pydantic import BaseModel

from ..custom_datetimes import BritishTime
from ...auth.authentication import get_current_active_user
from ...cache.redis_funcs import get_weather, set_weather
from ...db.models import HouseholdMemberPydantic
from ..central_heating import HeatingConf, Advance

from ..constants import WEATHER_URL, TEMPERATURE_URL, GPIO_PIN
from ...api.constants import TESTING
from ...utils.async_requests import get_json

if not TESTING:
    from ..central_heating import HeatingSystem
else:

    @dataclass
    class HeatingSystem:

        conf = HeatingConf(
            target="20",
            on_1="08:30",
            off_1="10:30",
            on_2="18:30",
            off_2="22:30",
            program_on=True,
        )

        def __init__(self, gpio_pin, temperature_url):
            pass

        def check_state(self):
            return self.conf.program_on

        def program_on(self):
            self.conf.program_on = True

        def program_off(self):
            self.conf.program_on = False


hs = HeatingSystem(GPIO_PIN, TEMPERATURE_URL)
router = APIRouter()


class WeatherReport(BaseModel):
    # keys = ['dt', 'sunrise', 'sunset', 'temp', 'feels_like',
    #         'pressure', 'humidity', 'dew_point', 'uvi', 'clouds',
    #         'visibility', 'wind_speed', 'wind_deg', 'weather']
    current: dict
    daily: List[dict]


class ApiInfo(BaseModel):
    indoor_temp: str
    temp_float: float
    outdoor_temp: str = "- -" + "°C"
    outdoor_float: Optional[float] = None
    weather: str = "- -"
    last_updated: str = "--:--:--"
    on: bool = hs.relay_state
    program_on: bool = hs.conf.program_on
    advance: Optional[Advance] = None


class SensorReadings(BaseModel):
    temperature: float
    pressure: float
    humidity: float


class HeatingInfo(BaseModel):
    indoor_temperature: float
    sensor_readings: SensorReadings
    relay_on: bool
    advance: Optional[Advance] = None
    conf: Optional[HeatingConf] = None


@router.get("/weather/")
async def weather() -> WeatherReport:
    weather_dict = await get_weather()
    if not weather_dict:
        r = await get_json(WEATHER_URL)
        weather_dict = {"current": r["current"], "daily": r["daily"]}
        await set_weather(weather_dict)
    weather_report = WeatherReport(**weather_dict)
    return weather_report


# Central heating endpoints
@router.get("/heating/info/", response_model=ApiInfo)
async def api():
    weather_report = await weather()
    updated = BritishTime.fromtimestamp(weather_report.current["dt"])
    return ApiInfo(
        indoor_temp=str("{0:.1f}".format(hs.temperature)) + "°C",
        temp_float=hs.temperature,
        outdoor_temp=str("{0:.1f}".format(weather_report.current["temp"])) + "°C",
        outdoor_float=float(weather_report.current["temp"]),
        weather=weather_report.current["weather"][0]["description"],
        last_updated=updated.strftime("%H:%S"),
        on=hs.relay_state,
        program_on=hs.conf.program_on,
        advance=hs.conf.advance,
    )


@router.get("/heating/info/temperature/", response_model=ApiInfo)
async def temp_only():
    return ApiInfo(
        indoor_temp=str("{0:.1f}".format(hs.temperature)) + "°C",
        temp_float=hs.temperature,
        on=hs.relay_state,
        program_on=hs.conf.program_on,
        advance=hs.conf.advance,
    )


@router.get("/heating/", response_model=HeatingInfo)
async def heating(conf: bool = False):
    context = {
        "indoor_temperature": hs.temperature,
        "sensor_readings": hs.measurements,
        "relay_on": hs.relay_state,
        "advance": Advance(on=bool(hs.advance_on), start=hs.advance_on),
    }
    if conf:
        context["conf"] = hs.conf
    return HeatingInfo(**context)


class ConfResponse(BaseModel):
    conf: HeatingConf


async def heating_conf():
    return ConfResponse(conf=hs.conf)


@router.get("/heating/conf/", response_model=HeatingConf)
async def heating_conf_old():
    return hs.conf


@router.post("/heating/", response_model=ConfResponse)
async def update_heating_conf(
    conf: HeatingConf, user: HouseholdMemberPydantic = Depends(get_current_active_user)
):
    if hs.conf != conf:
        hs.conf.__dict__.update(**conf.dict())
        hs.save_state()
        hs.main_loop()
    return await heating_conf()


@router.get("/heating/on_off/", response_model=ConfResponse)
async def heating_on_off(
    user: HouseholdMemberPydantic = Depends(get_current_active_user),
):
    if not hs.conf.program_on:
        hs.program_on()
    else:
        hs.program_off()
    return await heating_conf()


# @router.get("/heating/advance/{mins}/", response_model=Advance)
# async def advance(
#     mins: int = 30, user: HouseholdMemberPydantic = Depends(get_current_active_user)
# ):
#     """Turns heating on for a given period of time outside of the normal schedule."""
#     time_on = hs.advance(mins)
#     if time_on:
#         return Advance(on=True, start=time_on)
#     raise HTTPException(status_code=400)


@router.get("/heating/advance/{mins}/", response_model=Advance)
async def override_advance(
    mins: int = 30,
    user: HouseholdMemberPydantic = Depends(get_current_active_user),
):
    """Starts override/advance task in running event loop"""
    started = await hs.start_advance(mins)
    return Advance(on=True, start=started, relay=hs.relay_state)


@router.get("/heating/cancel/")
async def cancel_advance(
    user: HouseholdMemberPydantic = Depends(get_current_active_user),
):
    """Cancels advance task"""
    hs.cancel_advance()
    return Advance(on=False, relay=hs.relay_state)
