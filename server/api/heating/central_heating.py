import json
import os
import logging
import time
from datetime import datetime
from threading import Thread
from typing import Optional

import pigpio
import requests
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel

from .constants import TEMPERATURE_URL
from .custom_datetimes import BritishTime
from ..utils.concurrent_calls import urls

logging.basicConfig(level=logging.INFO)


class Advance(BaseModel):
    on: bool = False
    start: Optional[int] = None


class HeatingConf(BaseModel):
    on_1: str
    off_1: str
    on_2: Optional[str] = None
    off_2: Optional[str] = None
    target: int = 20
    program_on: bool = True
    advance: Optional[Advance] = None
    current: Optional[float] = None
    on: Optional[bool] = None


class HeatingSystem:
    config_file = os.path.abspath(os.getcwd()) + "/api/heating/heating.conf"
    scheduler = BackgroundScheduler()
    backup_scheduler = BackgroundScheduler()
    SENSOR_IP = TEMPERATURE_URL  # Local IP of temperature sensor API

    def __init__(self):
        """Create connection with temperature api and load settings
        from config file"""
        self.pi = pigpio.pi()
        self.measurements = requests.get(self.SENSOR_IP).json()
        self.conf = self.get_or_create_config()
        self.advance_on = None
        self.thread = None
        self.scheduler.add_job(self.main_loop, "interval", minutes=1, id="main_loop")
        self.scheduler.start(paused=True)
        self.backup_scheduler.add_job(
            self.backup_loop, "interval", minutes=5, id="main_loop"
        )
        self.backup_scheduler.start(paused=True)
        if self.conf.program_on:
            self.program_on()

    def thermostat_control(self):
        if self.too_cold is True:
            self.switch_on_relay()
        elif self.too_cold is False:
            self.switch_off_relay()

    def main_loop(self):
        """If time is within range, turn on relay if temp is below range,
        turn off if above range."""
        if self.check_time():
            self.thermostat_control()
        else:
            self.switch_off_relay()

    def backup_loop(self):
        """Turns on heating if house is below 5'C to prevent ice damage"""
        self.get_measurements()
        if float(self.temperature) < 5:
            self.switch_on_relay()
        elif float(self.temperature) > 6:
            self.switch_off_relay()

    def program_on(self):
        self.conf.program_on = True
        self.main_loop()
        self.backup_scheduler.pause()
        self.scheduler.resume()
        self.save_state()

    def program_off(self):
        self.conf.program_on = False
        self.switch_off_relay()
        self.scheduler.pause()
        self.backup_scheduler.resume()
        self.save_state()

    def get_or_create_config(self):
        conf = HeatingConf(
            target="18",
            on_1="06:30",
            off_1="08:30",
            on_2="20:30",
            off_2="22:30",
            program_on=True,
            on=self.check_state(),
        )
        try:
            with open(self.config_file, "r") as f:
                file_dict = json.load(f)
                conf = HeatingConf(**file_dict)
                conf.on = self.check_state()
        except (FileNotFoundError, TypeError):
            with open(self.config_file, "w") as f:
                json.dump(conf, f)
        finally:
            return conf

    def get_measurements(self):
        try:
            self.measurements = requests.get(self.SENSOR_IP).json()
        except Exception as e:
            logging.error(e)
        return self.measurements

    def check_temp(self):
        target = float(self.conf.target)
        current = self.temperature
        msg = f"\ntarget: {target}\ncurrent: {current}"
        logging.debug(msg)
        if target - 0.4 > current:
            return True
        elif target <= current:
            return False
        return None

    @staticmethod
    def parse_time(time):
        return datetime.strptime(time, "%H:%M").time()

    def check_time(self):
        if self.conf.program_on:
            time_now = BritishTime.now().time()
            if (
                self.parse_time(self.conf.off_1)
                > time_now
                > self.parse_time(self.conf.on_1)
            ):
                return True
            elif not self.conf.on_2:
                return False
            if (
                self.parse_time(self.conf.off_2)
                > time_now
                > self.parse_time(self.conf.on_2)
            ):
                return True
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
        if not self.check_state():
            self.pi.write(27, 1)
            self.conf.on = True

    def switch_off_relay(self):
        if self.check_state():
            self.pi.write(27, 0)
            self.conf.on = False

    def check_state(self):
        return not not self.pi.read(27)

    def advance(self, mins: int = 15):
        if self.check_time():
            return
        if not self.thread:
            self.advance_on = time.time()
            self.conf.advance = Advance(on=True, start=self.advance_on)
            self.thread = Thread(target=self.advance_thread, args=(mins,))
            self.thread.start()
        return self.advance_on

    def advance_thread(self, mins: int):
        while time.time() - self.advance_on < mins * 60:
            if self.check_time():
                self.cancel_advance()
            if not self.thread:
                break
            self.thermostat_control()
            time.sleep(30)

    def cancel_advance(self):
        self.thread = None
        self.advance_on = None
        self.conf.advance = Advance(on=False)
        self.switch_off_relay()

    @property
    def advance_start_time(self):
        return self.advance_on

    @property
    def too_cold(self) -> Optional[bool]:
        return self.check_temp()

    @property
    def within_program_time(self) -> bool:
        return self.check_time()

    @property
    def temperature(self) -> float:
        return float(self.get_measurements()["temperature"])
