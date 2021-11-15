# Smart Central Heating system

This is a followup to a [previous project](https://mjfullstack.medium.com/). Now with the wisdom of several rewrites and a year of using the system, I feel confident I can offer a decent tutorial for people wishing to do the same thing. I have a [GitHub repository](https://github.com/nihilok/SmartHomeApp) which contains a slightly bloated version of the main API, with some extra apps/features that I have added along the way (a camera server being one example). Here however I will focus just on building out the heating control system and authentication,; the api is suitably modular that these parts can be used in isolation.  

### Hardware:
- Raspberry Pi 3B
- Adafruit Relay Board
- NodeMCU ESP8266 microcontroller
- BME280 Temperature Sensor

### Software:
- REST API / Nginx server (Raspberry Pi)
- MicroPython/Arduino server for NodeMCU/BME280

As I mentioned, it has been helpful to think about this project in terms of modules, so lets look at a possible folder structure for the main API part of the project.

```
central-heating-project/
    server/
        auth/
            __init__.py
            constants.py
            auth_endpoints.py
        heating/
            __init__.py
            heating_system.py
            heating_endpoints.py
        __init__.py
    main.py
```

Ok let's start, as I did, with the heating system. I have stuck with the OOP approach that I set out with, as it has proved useful to be able to import the whole system and reference its attributes and properties in the API, but a functional approach based on the main methods and properties would also be possible.
```python3
from typing import Optional

import pigpio
import requests

from apscheduler.schedulers.background import BackgroundScheduler


class HeatingSystem:
    
    RELAY_GPIO_PIN = 27
    THRESHOLD = 0.4
    TEMPERATURE_URL = 'http://192.168.1.10' # URL/IP of the NodeMCU
    scheduler = BackgroundScheduler()
    
    def __init__(self):
        """
        Tasks:
        - Create or get a config file for persistent settings
        - Get the first sensor readings
        - Set up connection with Raspberry Pi GPIO pins
        - Initialize scheduled tasks
        """
        self.config = {
            'target': 20,
        }
        self.measurements = self.get_measurements()
        self.pi = pigpio.pi()
        self.scheduler.add_job(main_loop)
        
    def get_measurements(self):
        """Gets measurements from temperature sensor and handles errors, 
        by returning the last known set of measurements or a default"""
        try:
            self.measurements = requests.get(self.TEMPERATURE_URL).json()
        except Exception as e:
            print(e)
        try:
            measurements = self.measurements
        except AttributeError:
            measurements = {
                'temperature': 0,
                'pressure': 0,
                'humidity': 0
            }
        return measurements
    
    @property
    def temperature(self) -> float:
        """Get and return the temperature as a float"""
        return float(self.get_measurements()['temperature'])
    
    @property
    def target(self) -> int:
        """Return the current target temperature as an integer"""
        return int(self.config['target'])
        
    @property
    def too_cold(self) -> Optional[bool]:
        """Checks current temperature against target temperature and returns
        False if temperature is above, True if temperature is below and None if
        temperature is within the given threshold"""
        if self.temperature < self.target - 0.4:
            return True
        elif self.target <= self.temperature:
            return False
    
    @property
    def relay_on(self):
        """Checks the state of the GPIO pin controlling the relay"""
        return not not self.pi.read(self.RELAY_GPIO_PIN)

    def switch_on_relay(self):
        """Switches on the relay controlling the heating pump/boiler"""
        if not self.relay_on:
            self.pi.write(self.RELAY_GPIO_PIN, 1)

    def switch_off_relay(self):
        """Switches off the relay controlling the heating pump/boiler"""
        if self.relay_on:
            self.pi.write(self.RELAY_GPIO_PIN, 0)

    def main_loop(self):
        if self.too_cold is None:
            return
        elif self.too_cold is True:
            self.switch_on_relay()
        elif self.too_cold is False:
            self.switch_off_relay()
    
    def frost_stat_loop(self):
        if self.temperature < 5:
            self.switch_on_relay()
        elif self.temperature > 6:
            self.switch_off_relay()

```

So straight away we have a couple of Python dependencies (`pip install requests pigpio apscheduler`), so it would be worth creating a virtual environment, and you will also need to install and run the pigpio daemon on your Raspberry Pi (`sudo apt install pigpiod`). Otherwise, though, you can see that the system is relatively simple, and despite it still being incomplete without a way to set, store & check times that you want the main loop to run, and without any measurements served by the NodeMCU unit, which we haven't started on yet, we have everything we need to see how the essence of the system will work.

We will come back to this to add more complexity, but for now let's take a look at the API endpoints and see if we can't turn on the relay from our smartphone! I know straight away that I'm going to be using FastApi for this build, as while the initial build of this used Flask, FastAPI has now far surpassed Flask as my go-to framework of choice.

Again, from a modularity-first perspective, we should create a specific router for our heating related endpoints and a basic FastAPI (ASGI) app that we can add different routers to. 
In `server/heating/heating_endpoints.py`:
```python3
from fastapi import APIRouter

router = APIRouter()
```
And then in `server/__init__.py`:
```python3
from fastapi import FastAPI
from .heating.heating_endpoints import router as heating_router

app = FastAPI()
app.include_router(heating_router)
```
And now were ready to keep working on `heating_endpoints.py` knowing that all of the routes created with the router will be included in our app.
`heating_endpoints.py`
```python3
import time
from .heating_system import HeatingSystem

hs = HeatingSystem()

@router.get('/')
async def heating_index():
    hs.switch_on_relay()
    time.sleep(5)
    hs.switch_off_relay()
    return {'message': 'done!'}
```

Now let's install UVicorn, an ASGI server (`pip install uvicorn`) and create a `main.py` file to run our server.
```python3
# central-heating-project/main.py
import uvicorn

if __name__ == "__main__":
    uvicorn.run('server:app', port=8080)
```

And now if we run that (`python main.py`) and go to http://localhost:8080 in a browser we should see the relay turn on for 5 seconds before switching off again.