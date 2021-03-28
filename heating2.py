import json
import os
import time
import logging
from datetime import datetime
from threading import Thread
import pigpio
import requests
from apscheduler.schedulers.background import BackgroundScheduler
from . import telegram_bot as tg


SENSOR_IP = 'http://192.168.1.88/'


class Heating:
    logger = logging.getLogger('Heating')
    fh = logging.FileHandler('/home/mj/FlaskApp/FlaskApp/heating.log')
    formatter = logging.Formatter('[%(levelname)s][%(asctime)s][%(name)s] %(message)s',
                                  datefmt='%Y-%m-%d %H:%M:%S')
    fh.setFormatter(formatter)
    logger.addHandler(fh)
    logger.setLevel(logging.DEBUG)

    scheduler = BackgroundScheduler()

    def __init__(self):
        os.chdir(os.path.dirname(__file__))
        self.pi = pigpio.pi()
        self.error_alert_sent = False
        try:
            with open('heating.conf.json', 'r') as f:
                self.config = json.load(f)
        except Exception:
            self.config = {
                "tstat": False,
                "program_on": False,
                "program": {
                    "on_1": "07:30",
                    "off_1": "09:30",
                    "on_2": "17:30",
                    "off_2": "22:00"
                },
                "desired": 19
            }
            self.save_state_thread()
        self.temperature = self.check_temperature()
        self.humidity = self.check_humidity()
        self.pressure = self.check_pressure()
        self.thread_store = []
        if self.config['program_on']:
            self.start_scheduled_tasks()
            if self.config['tstat']:
                self.thermostat_thread()

    @staticmethod
    def parse_time(time):
        return datetime.strptime(time, '%H:%M').time()

    def check_time(self):
        time_now = datetime.fromtimestamp(time.time()).time()
        if any((all((time_now > self.parse_time(self.config['program']['on_1']),
                time_now < self.parse_time(self.config['program']['off_1']))),
                all((time_now > self.parse_time(self.config['program']['on_2']),
                time_now < self.parse_time(self.config['program']['off_2']))))):
            return True
        return False

    def stop_jobs(self):
        self.config['program_on'] = False
        self.scheduler.shutdown()
        self.stop_loop()

    def start_scheduled_tasks(self):
        self.config['program_on'] = True
        jobs = {'on_1', 'off_1', 'on_2', 'off_2'}
        for job in jobs:
            hour = datetime.strptime(self.config['program'][job], '%H:%M').hour
            minute = datetime.strptime(self.config['program'][job], '%H:%M').minute
            if 'on' in job:
                self.scheduler.add_job(self.thermostat_loop, trigger='cron', hour=hour, minute=minute, id=job)
            else:
                self.scheduler.add_job(self.stop_loop, trigger='cron', hour=hour, minute=minute, id=job)
        self.scheduler.start()
        self.save_state_thread()

    def change_schedule(self):
        jobs = {'on_1', 'off_1', 'on_2', 'off_2'}
        for job in jobs:
            hour = datetime.strptime(self.config['program'][job], '%H:%M').hour
            minute = datetime.strptime(self.config['program'][job], '%H:%M').minute
            self.scheduler.reschedule_job(job, trigger='cron', hour=hour, minute=minute)

    def switch_on_relay(self):
        self.pi.write(27, 1)
        self.save_state_thread()

    def switch_off_relay(self):
        self.pi.write(27, 0)
        self.save_state_thread()

    def check_state(self):
        return self.pi.read(27)

    def save_state(self):
        with open('heating.conf.json', 'w') as f:
            f.write(json.dumps(self.config))

    def save_state_thread(self):
        t = Thread(target=self.save_state)
        t.daemon = True
        t.start()

    def thermostat_loop(self):
        self.config['tstat'] = True
        self.save_state_thread()
        while self.config['tstat']:
            if float(self.check_temperature()) < float(self.config['desired']) - 0.4 and not self.check_state():
                self.switch_on_relay()
            elif float(self.check_temperature()) > float(self.config['desired']) + 0.4 and self.check_state():
                self.switch_off_relay()
            time.sleep(60)

    def stop_loop(self):
        self.config['tstat'] = False
        if self.thread_store:
            for t in self.thread_store:
                t.join()
            self.thread_store = []
        self.switch_off_relay()
        self.save_state_thread()

    def thermostat_thread(self):
        t1 = Thread(target=self.thermostat_loop)
        t1.daemon = True
        t1.start()
        self.thread_store.append(t1)

    def stop_thread(self):
        self.config['tstat'] = False
        self.switch_off_relay()
        self.save_state_thread()
        self.logger.info('thermostatic control switched off naturally')

    def sensor_api(self):
        try:
            req = requests.get(SENSOR_IP)
            data = json.loads(req.text)
            if self.error_alert_sent:
                tg.send_message('Contact with sensor resumed')
                self.error_alert_sent = False
            return data
        except Exception as e:
            print(e)
            self.logger.warning('cannot communicate with sensor API')
            if not self.error_alert_sent:
                tg.send_message('WARNING: Heating module cannot communicate with sensor API')
                self.error_alert_sent = True
            time.sleep(1)
            return {
                'temperature': self.temperature,
                'humidity': self.humidity,
                'pressure': self.pressure,
            }

    def check_temperature(self):
        self.temperature = self.sensor_api()['temperature']
        return self.temperature

    def check_pressure(self):
        self.pressure = self.sensor_api()['pressure']
        return self.pressure

    def check_humidity(self):
        self.humidity = self.sensor_api()['humidity']
        return self.humidity


if __name__ == '__main__':
    hs = Heating()
    while True:
        print(f'''________________________________________________________________
==={datetime.utcnow().time()}===
Temp: {hs.check_temperature()}
Pressure: {hs.check_pressure()}
Humidity: {hs.check_humidity()}
________________________________________________________________
        ''')
        time.sleep(2)