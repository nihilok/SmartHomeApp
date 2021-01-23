import json
import time
from datetime import datetime
from threading import Thread
import pigpio
import requests
from requests.exceptions import ConnectionError


class Heating:
    def __init__(self):
        self.pi = pigpio.pi()
        self.advance = False
        self.advance_start_time = None
        self.on = False
        self.tstat = False
        self.temperature = self.check_temperature()
        self.humidity = self.check_humidity()
        self.pressure = self.check_pressure()
        self.desired_temperature = 19
        self.timer_program = {
            'on_1': '07:30',
            'off_1': '09:30',
            'on_2': '17:30',
            'off_2': '22:00',
        }
    def thermostatic_control(self):
        self.tstat = True
        while self.tstat:
            time_check = datetime.strptime(datetime.utcnow().time().strftime('%H:%M'), '%H:%M').time()
            on_1 = datetime.strptime(self.timer_program['on_1'], '%H:%M').time()
            off_1 = datetime.strptime(self.timer_program['off_1'], '%H:%M').time()
            on_2 = datetime.strptime(self.timer_program['on_2'], '%H:%M').time()
            off_2 = datetime.strptime(self.timer_program['off_2'], '%H:%M').time()
            if (on_1 < time_check < off_1) or (on_2 < time_check < off_2):
                if float(self.check_temperature()) < float(self.desired_temperature) and not self.check_state():
                    self.switch_on_relay()
                elif float(self.check_temperature()) > float(self.desired_temperature) + 0.5 and self.check_state():
                    self.switch_off_relay()
                time.sleep(5)
            else:
                if self.check_state():
                    self.switch_off_relay()
                time.sleep(900)
        return

    def thermostat_thread(self):
        self.on = True
        t1 = Thread(target=self.thermostatic_control)
        t1.daemon = True
        t1.start()

    def stop_thread(self):
        self.on = False
        self.tstat = False
        self.switch_off_relay()

    def sensor_api(self):
        try:
            req = requests.get('http://192.168.1.88/')
            data = json.loads(req.text)
            return data
        except ConnectionError:
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

    def switch_on_relay(self):
        self.pi.write(27, 1)

    def switch_off_relay(self):
        self.pi.write(27, 0)

    def check_state(self):
        return self.pi.read(27)

    def start_time(self):
        if not self.advance_start_time:
            self.advance_start_time = datetime.now().strftime('%b %d, %Y %H:%M:%S')
        return self.advance_start_time


if __name__ == '__main__':
    hs = Heating()
    while True:
        print(f'''________________________________________________________________
{datetime.utcnow().time()}
Temp: {hs.check_temperature()}
Pressure: {hs.check_pressure()}
Humidity: {hs.check_humidity()}
________________________________________________________________
        ''')
        time.sleep(2)
