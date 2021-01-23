#!/usr/bin/env/python3
import time
import pigpio
try:
    from smbus2 import SMBus
except ImportError:
    from smbus import SMBus
from bme280 import BME280

from flask import Flask, jsonify, make_response
app = Flask(__name__)

pi = pigpio.pi()
bus = SMBus(1)
bme = BME280(i2c_dev=bus)

# throwaway readings:
for i in range(3):
    bme.get_temperature()
    bme.get_humidity()
    bme.get_pressure()


@app.route('/')
def sensor_api():
    response = make_response(jsonify({'temperature': bme.get_temperature(),
                                      'humidity': bme.get_humidity(),
                                      'pressure': bme.get_pressure()}))
    response.status_code = 200
    return response
