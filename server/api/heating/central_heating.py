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

from .custom_datetimes import BritishTime
from ..utils.concurrent_calls import urls

logging.basicConfig(level=logging.INFO)


class HeatingConf(BaseModel):
    on_1: str
    off_1: str
    on_2: Optional[str] = None
    off_2: Optional[str] = None
    target: int = 20
    program_on: bool = True


class HeatingSystem:
    config_file = os.path.abspath(os.getcwd()) + '/api/heating/heating.conf'
    scheduler = BackgroundScheduler()
    SENSOR_IP = urls['temperature']  # Local IP of temperature sensor API

    def __init__(self):
        """Create connection with temperature api and load settings
        from config file"""
        self.pi = pigpio.pi()
        self.measurements = requests.get(self.SENSOR_IP).json()
        self.conf = self.get_or_create_config()
        self.advance_on = None
        self.thread = None
        self.scheduler.add_job(self.main_loop,
                               'interval',
                               minutes=1,
                               id='main_loop')
        self.scheduler.start(paused=True)
        if self.conf.program_on:
            self.program_on()

    def main_loop(self):
        """If time is within range, turn on relay if temp is below range,
        turn off if above range."""
        if self.check_time():
            temp = self.check_temp()
            if temp is True:
                self.switch_on_relay()
            elif temp is False:
                self.switch_off_relay()
            pass
        else:
            self.switch_off_relay()

    def program_on(self):
        self.conf.program_on = True
        self.main_loop()
        self.scheduler.resume()
        self.save_state()

    def program_off(self):
        self.conf.program_on = False
        self.switch_off_relay()
        self.scheduler.pause()
        self.save_state()

    def get_or_create_config(self):
        conf = HeatingConf(
            target="18",
            on_1="06:30",
            off_1="08:30",
            on_2="20:30",
            off_2="22:30",
            program_on=True
        )
        try:
            with open(self.config_file, 'r') as f:
                file_dict = json.load(f)
                conf = HeatingConf(**file_dict)
        except (FileNotFoundError, TypeError):
            with open(self.config_file, 'w') as f:
                json.dump(conf, f)
        finally:
            return conf

    def get_measurements(self):
        self.measurements = requests.get(self.SENSOR_IP).json()

    def check_temp(self):
        self.get_measurements()
        target = self.conf.target
        current = self.measurements['temperature']
        msg = f'\ntarget: {target}\ncurrent: {current}'
        logging.debug(msg)
        if (float(target) - 0.4) > float(current):
            return True
        elif float(target) < float(current):
            return False
        return None

    @staticmethod
    def parse_time(time):
        return datetime.strptime(time, '%H:%M').time()

    def check_time(self):
        time_now = BritishTime.now().time()
        if (self.parse_time(self.conf.off_1) >
                time_now > self.parse_time(self.conf.on_1)):
            return True
        elif self.conf.on_2:
            if self.parse_time(self.conf.off_2) > time_now > self.parse_time(
                    self.conf.on_2):
                return True
        return False

    def save_state(self):
        with open(self.config_file, 'w') as f:
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

    def switch_off_relay(self):
        if self.check_state():
            self.pi.write(27, 0)

    def check_state(self):
        return True if self.pi.read(27) else False

    def advance(self, mins: int = 15):
        if not self.check_time():
            if not self.advance_on:
                self.advance_on = time.time()
                self.thread = Thread(target=self.advance_thread, args=(mins,))
                self.thread.start()
        return self.advance_on

    def advance_thread(self, mins: int):
        while time.time() - self.advance_on < mins * 60:
            if not self.thread or not self.advance_on:
                break
            if self.check_temp():
                self.switch_on_relay()
            else:
                self.switch_off_relay()
            time.sleep(10)

    def cancel_advance(self):
        self.thread = None
        self.advance_on = None
