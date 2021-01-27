#!/usr/bin/env/python3
import logging
from smbus2 import SMBus
from bme280 import BME280

from flask import Flask, jsonify, make_response
app = Flask(__name__)

bus = SMBus(1)
bme = BME280(i2c_dev=bus)
logger = logging.getLogger(__name__)
fh = logging.FileHandler('/home/pi/temp_api/temp_api.log')
formatter = logging.Formatter('[%(levelname)s][%(asctime)s][%(name)s] %(message)s',
                              datefmt='%Y-%m-%d %H:%M:%S')
fh.setFormatter(formatter)
logger.addHandler(fh)
logger.setLevel(logging.DEBUG)

# throwaway readings:
for i in range(3):
    bme.get_temperature()
    bme.get_humidity()
    bme.get_pressure()
logger.debug('module initialized')

@app.route('/')
def sensor_api():
    response = make_response(jsonify({'temperature': bme.get_temperature(),
                                      'humidity': bme.get_humidity(),
                                      'pressure': bme.get_pressure()}))
    response.status_code = 200
    return response
