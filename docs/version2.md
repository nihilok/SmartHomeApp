# Smart Central Heating system

This is a followup to a [previous project](https://mjfullstack.medium.com/). Now with the wisdom of several rewrites and a year of using the system, I feel confident I can offer a decent tutorial for people wishing to do the same thing. I have a [GitHub repository](https://github.com/nihilok/SmartHomeApp) which contains a slightly bloated version of the main API, with some extra apps/features that I have added along the way (a camera server being one example). Here however I will focus just on building out the heating control system and authentication; the api is suitably modular that these parts can be used in isolation. I will also save the front-end code for another tutorial.

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

In my setup, this will (eventually) be on the machine whose GPIO pins control the relay, which is separate from the temperature sensor, although it would be possible to have the temperature sensor attached to the same Raspberry Pi. See my initial write-up for more.

Ok let's start, as I did then, with the heating system. I have stuck with the OOP approach that I set out with, as it has proved useful to be able to import the whole system and reference its attributes and properties in the API, but a functional approach based on the main methods and properties would also be possible. The essence of the `HeatingSystem` class is as follows:
```python3
# central-heating-project/server/heating/heating_system.py

import pigpio


class HeatingSystem:
    
    RELAY_GPIO_PIN = 27
    pi = pigpio.pi()
    
    def __init__(self):
        """
        Tasks:
        - Create or get a config file for persistent settings
        - Get the first sensor readings
        - set up scheduled tasks
        """
    
    @property
    def relay_on(self) -> bool:
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
```
So straight away we have a Python dependency (`pip install pigpio`), so it would be worth creating a virtual environment; you will also need to install and run the pigpio daemon on your Raspberry Pi (`sudo apt install pigpiod -y && pigpiod`). Otherwise, though, you can see that the system is relatively simple, and while it still needs a way to check the measurements served by the NodeMCU unit, which we haven't started on yet, and a way to check these against a target set by the user, as well as to schedule the task of doing so, we have everything we need to see how basic functionality of the system will work.

We will come back to this to add more complexity, but for now let's take a look at the API endpoints and see if we can't turn on the relay from our smartphone! I know straight away that I'm going to be using FastAPI for this build, as while the initial build of this used Flask, FastAPI has now far surpassed Flask as my go-to framework of choice.

Again, from a modularity-first perspective, we should create a basic FastAPI (ASGI) app that we can add different routers to, and then in a separate file create a specific router for our heating related endpoints:
```python3
# central-heating-project/server/heating/heating_endpoints.py

from fastapi import APIRouter

router = APIRouter()
```
```python3
# central-heating-project/server/__init__.py

from fastapi import FastAPI
from .heating.heating_endpoints import router as heating_router

app = FastAPI()
app.include_router(heating_router)
```
And now were ready to keep working on `heating_endpoints.py` knowing that all of the routes created with the router will be included in our app.
```python3
# central-heating-project/server/heating/heating_endpoints.py

import time
from fastapi import APIRouter

from .heating_system import HeatingSystem

router = APIRouter()
hs = HeatingSystem()

@router.get('/relay')
async def heating_index():
    hs.switch_on_relay()
    time.sleep(5)
    hs.switch_off_relay()
    return {'message': 'done!'}
```
Now let's install UVicorn, an ASGI server, (`pip install uvicorn`) and create a `main.py` file to run our server.
```python3
# central-heating-project/main.py

import uvicorn

if __name__ == "__main__":
    uvicorn.run('server:app', port=8080)
```

And now if we run that (`python main.py`) and go to http://localhost:8080/relay in a browser we should see the relay turn on for 5 seconds before switching off again, and the success message json should then load in the browser window. Now it's just a case of deciding what different routes we need, and creating a front-end app to control the system. First, let's add a few more useful methods and properties etc. to the `HeatingSystem`:

```python3
# central-heating-project/server/heating/heating_system.py

from typing import Optional

import pigpio
import requests

from apscheduler.schedulers.background import BackgroundScheduler


class HeatingSystem:
    
    RELAY_GPIO_PIN = 27
    pi = pigpio.pi()
    THRESHOLD = 0.3
    TEMPERATURE_URL = 'http://192.168.1.10' # URL/IP of the NodeMCU
    scheduler = BackgroundScheduler()
    
    def __init__(self):
        self.config = {'target': 20}
        self.measurements = self.get_measurements()
        self.scheduler.add_job(self.main_loop, 'interval', minutes=5)
        self.scheduler.start()
    
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
    def relay_on(self) -> bool:
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
        """Checks if temperature is below, within or above the target and switches on/off relay accordingly"""
        if self.too_cold is None:
            return
        elif self.too_cold is True:
            self.switch_on_relay()
        elif self.too_cold is False:
            self.switch_off_relay()
    
    def frost_stat_loop(self):
        """Checks if temperature is below a dangerous level (5'C), and switches on heating if so"""
        if self.temperature < 5:
            self.switch_on_relay()
        elif self.temperature > 6:
            self.switch_off_relay()
    
    def get_measurements(self) -> dict:
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

```
So, there's another dependency (`pip install apscheduler`), which is a really simple, but popular and powerful library letting us schedule tasks at either specific times or at intervals, and you can already see it taking shape. The system in its current state will actually perform the task of keeping our space above 20'C, and will check the temperature every 5 minutes. We currently still have no way to configure the system, but the `conf` dictionary is a hint of what's coming, as it will also store the times we want the heating to be on, which, again, we can add in later. We're also not using the `frost_stat_loop` method, a feature which guards against frozen pipes that is included in most off the shelf wall heating programmers.

I've added a `THRESHOLD` attribute that defines the 'deadzone' in which the relay will neither be switched on nor off, used in the `too_cold` property which is in turn used in the `main_loop` method. It returns a bool (`True`/`False`) unless the temperature is within the threshold, in which case it returns `None` (it has no return clause, so technically is a void function, but in Python this is the same as returning `None`).

OK let's get to the fun stuff, the endpoints! For the purposes of this tutorial, I have decided that 4 endpoints will suffice: one to get the data (GET); one to set the data (POST); one to trigger/cancel an override (GET); and one to turn on/off the program (GET).

One great thing about FastAPI and one of its core dependencies, Pydantic, is that it allows you to define types for the arguments that your endpoints accept which when used correctly, serve to validate data that is either being sent or received by the API. When used in conjunction with TypeScript on the front-end, it is truly a delight to work with. If your types are named similarly, it is almost like you are using different dialects of the same language, when jumping between front and back.

```python3
# central-heating-project/server/heating/heating_endpoints.py

from fastapi import APIRouter
from pydantic import BaseModel

from .heating_system import HeatingSystem

router = APIRouter()
hs = HeatingSystem()


# Create models for our parameters/responses:
class HeatingResponse(BaseModel):
    temperature: float
    target: int
    
class HeatingUpdate(BaseModel):
    target: int


# Create functions for our different endpoints/routes:
@router.get('/heating/')
async def heating():
    return HeatingResponse(
        temperature=hs.temperature,
        target=hs.target,
    )

@router.post('/heating/')
async def update_heating(update: HeatingUpdate):
    hs.conf['target'] = update.target
    return await heating()
```

The one thing that you have to get used to with FastAPI is using async / await. But one way to look at it is that an asynchronous function, or coroutine, will behave exactly as you would expect a synchronous function to behave (within another asynchronous function) if it is preceded with the keyword `await`.

Now would be a good time to check out the Swagger documentation that is automatically generated for us. Go to `http://localhost:8080/docs`. We can get even more info in our docs and further validate our responses, by including a response model parameter in the route decorator, like so (in this case the `update_heating` function returns the result of the `heating` function, so the response models are the same):

```python3
# central-heating-project/server/heating/heating_endpoints.

@router.get('/heating/', response_model=HeatingResponse)
async def heating():
    return HeatingResponse(
        temperature=hs.temperature,
        target=hs.target,
    )

@router.post('/heating/', response_model=HeatingResponse)
async def update_heating(update: HeatingUpdate):
    hs.conf['target'] = update.target
    return await heating()
```