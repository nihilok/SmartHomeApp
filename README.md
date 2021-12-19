# Smarthome App
### _[Central heating system](https://github.com/nihilok/OpenCentralHeating) and other tools._

###### Recent changes:

- This repository has now been succeded (sort of) by [OpenCentralHeating](https://github.com/nihilok/OpenCentralHeating) which focuses just on the central heating feautures.

### Installation:

My setup involves 3 physical machines, a Raspberry Pi 3B, running Ubuntu Server 20.04, as the main server connected to the relay that controls the central heating, a NodeMCU ESP8266 microcontroller running MicroPython that acts as a temperature sensor and serves JSON data, and a separate Raspberry Pi Zero W, running Raspian Lite, as a security camera.

[-Full write-up of initial build-](https://python.plainenglish.io/building-a-smart-central-heating-system-with-a-raspberry-pi-and-python-403c6ea0fd7e)

###### Main server
1. Clone the repository
2. Install requirements: `pip install -r requirements.txt`
3. run server with uvicorn, eg. `uvicorn server:app`

__N.B.__ Music over bluetooth (`mpv`) functionality currently in development.
Additional requirement: `sudo apt install libmpv-dev` or similar depending on your distro.

###### Temperature sensor (old instructions for Raspberry Pi)
1. copy `temp_api.py` and `network_check.sh` to the temperature sensor machine (in my case, the Pi Zero W) and set the `SENSOR_IP` in `heating.py` on the main machine to the local IP of this machine.
2. set up BME280 or similar temperature sensor module with GPIO pins according to pins used in `temp_api.py` (or adjust code to reflect pins you use)
3. `pip3 install flask`
4. make `network_check.sh` executable (`chmod +x`) and add to your cron tab to run every few hours (this will solve the problem of your Pi Zero W shutting off wi-fi to save power, you should also disable power saving in the pi's wi-fi settings, but this was not a complete fix for me, hence the shell script.)

_microcontroller script/documentation to follow_
