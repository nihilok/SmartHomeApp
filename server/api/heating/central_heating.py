import asyncio
import json
import os
import logging
import time
from datetime import datetime
from typing import Optional

import pigpio
import requests
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel

from .custom_datetimes import BritishTime
from .telegram_bot import send_message
from ..logger import get_logger

logger = get_logger()


class Advance(BaseModel):
    on: bool = False
    start: Optional[int] = None
    relay: Optional[bool] = None


class HeatingConf(BaseModel):
    on_1: str
    off_1: str
    on_2: Optional[str] = None
    off_2: Optional[str] = None
    target: int = 20
    program_on: bool = True
    advance: Optional[Advance] = None


class HeatingSystem:
    config_file = os.path.abspath(os.getcwd()) + "/api/heating/heating.conf"
    scheduler = BackgroundScheduler()
    backup_scheduler = BackgroundScheduler()
    THRESHOLD = 0.2

    def __init__(self, gpio_pin: int, temperature_url: str):
        """Create connection with temperature api and load settings
        from config file"""
        self.pi = pigpio.pi()
        self.gpio_pin = gpio_pin
        self.temperature_url = temperature_url
        self.error: list[bool, bool] = [False, False]
        self.conf = self.get_or_create_config()
        self.measurements = self.get_measurements()
        self.advance_on = None
        self.thread = None
        self.scheduler.add_job(self.main_loop, "interval", minutes=1, id="main_loop")
        self.scheduler.start(paused=True)
        self.backup_scheduler.add_job(
            self.backup_loop, "interval", minutes=5, id="backup_loop"
        )
        if self.conf.program_on:
            self.program_on()
        else:
            self.backup_scheduler.start()

    @property
    def too_cold(self) -> Optional[bool]:
        return self.check_temp()

    @property
    def within_program_time(self) -> bool:
        return self.check_time()

    @property
    def temperature(self) -> float:
        return float(self.get_measurements()["temperature"])

    @property
    def relay_state(self) -> bool:
        return not not self.pi.read(self.gpio_pin)

    def thermostat_control(self):
        check = self.too_cold
        if check is True:
            logger.debug('too cold')
            self.switch_on_relay()
        elif check is False:
            logger.debug('warm enough')
            self.switch_off_relay()

    def main_loop(self):
        """If time is within range, turn on relay if temp is below range,
        turn off if above range."""
        if self.within_program_time:
            self.thermostat_control()
        else:
            if not self.advance_on:
                self.switch_off_relay()

    def backup_loop(self):
        """Turns on heating if house is below 5'C to prevent ice damage"""
        temp = float(self.temperature)
        if temp < 5:
            logger.debug('Frost stat warning (below 5`C)')
            self.switch_on_relay()
        elif temp > 6:
            logger.debug('Frost stat warning resolved (above 6`C)')
            self.switch_off_relay()

    def program_on(self):
        self.conf.program_on = True
        self.main_loop()
        self.scheduler.resume()
        if self.backup_scheduler.running:
            self.backup_scheduler.shutdown()
        self.save_state()

    def program_off(self):
        self.conf.program_on = False
        if not self.advance_on:
            self.switch_off_relay()
        self.scheduler.pause()
        self.backup_scheduler.start()
        self.save_state()

    def get_measurements(self) -> dict:
        """Gets measurements from temperature sensor and handles errors,
        by returning the last known set of measurements or a default"""
        try:
            req = requests.get(self.temperature_url)
            if req.status_code == 200 and any(self.error):
                self.error = [False, False]
            self.measurements = req.json()
        except Exception as e:
            if not self.error[0]:
                log_msg = f"{__name__}: {e.__class__.__name__}: {str(e)}"
                logger.error(log_msg)
                send_message(log_msg)
                self.error[0] = True
        try:
            return self.measurements
        except AttributeError as e:
            if not self.error[1]:
                log_msg = f"{__name__}: {e.__class__.__name__}: No measurements found on first load"
                logger.error(log_msg)
                send_message(log_msg)
                self.error[1] = True
            return {"temperature": 20, "pressure": 0, "humidity": 0}

    def check_temp(self) -> Optional[bool]:
        target = float(self.conf.target)
        current = self.temperature
        msg = f"target: {target}, current: {current}"
        logger.debug(msg)
        if target - self.THRESHOLD > current:
            return True
        elif target <= current:
            return False

    @staticmethod
    def parse_time(time: str) -> datetime.time:
        return datetime.strptime(time, "%H:%M").time()

    def check_time(self) -> bool:
        if not self.conf.program_on:
            return False
        time_now = BritishTime.now().time()
        try:
            if (
                self.parse_time(self.conf.off_1)
                > time_now
                > self.parse_time(self.conf.on_1)
            ):
                return True
            elif not self.conf.on_2:
                return False
            elif (
                self.parse_time(self.conf.off_2)
                > time_now
                > self.parse_time(self.conf.on_2)
            ):
                return True
        except ValueError:
            logger.warning(
                f"ValueError while checking time (times: {self.conf.on_1,self.conf.off_1,self.conf.on_2,self.conf.off_2})"
            )
            return False

    def save_state(self):
        with open(self.config_file, "w") as f:
            json.dump(jsonable_encoder(self.conf), f)

    def change_times(self, on1, off1, on2=None, off2=None):
        """Accept times in format HH:MM or None for set 2"""
        self.conf.on_1 = on1
        self.conf.off_1 = off1
        self.conf.on_2 = on2
        self.conf.off_2 = off2
        self.save_state()

    def change_temp(self, temp: int):
        self.conf.target = temp
        self.save_state()

    def switch_on_relay(self):
        if not self.relay_state:
            logger.debug('Switching on relay')
            self.pi.write(self.gpio_pin, 1)

    def switch_off_relay(self):
        if self.relay_state:
            logger.debug('Switching off relay')
            self.pi.write(self.gpio_pin, 0)

    async def async_advance(self, mins: int = 30):
        if not self.advance_on:
            logger.debug('Advance starting')
            self.scheduler.pause()
            self.advance_on = time.time()
            self.conf.advance = Advance(on=True, start=self.advance_on)
            check = self.advance_on
            while check > time.time() - (mins * 60):
                if self.within_program_time or not self.advance_on:
                    self.cancel_advance()
                    break
                self.thermostat_control()
                await asyncio.sleep(60)
        logger.debug('Advance already started')

    async def start_advance(self, mins: int = 30):
        loop = asyncio.get_running_loop()
        loop.create_task(self.async_advance(mins))
        while not self.advance_on:
            await asyncio.sleep(0.1)
        logger.debug(f'Started at {BritishTime.fromtimestamp(self.advance_on)}')
        return self.advance_on

    def cancel_advance(self):
        self.thread = None
        self.advance_on = None
        self.conf.advance = Advance(on=False)
        self.scheduler.resume()
        logger.debug('Advance cancelled')
        self.main_loop()
        self.save_state()

    def get_or_create_config(self):
        try:
            with open(self.config_file, "r") as f:
                file_dict = json.load(f)
                conf = HeatingConf(**file_dict)
        except Exception as e:
            logging.error(str(e))
            conf = HeatingConf(
                target=20,
                on_1="06:30",
                off_1="08:30",
                on_2="20:30",
                off_2="22:30",
                program_on=True,
            )
            with open(self.config_file, "w") as f:
                json.dump(jsonable_encoder(conf), f)
        return conf
