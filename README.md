# Smarthome App
### _Central heating system et al._

###### Recent changes:

- `apscheduler` for heating programmer
- more 'ACID-like' transaction for heating settings
- `mpv` integration for music over bluetooth
- Keep notes integration (for shopping list etc.) with `gkeepapi`

### Installation:

My setup involves 2 physical machines, a Raspberry Pi 3B as the main server (which also performs other tasks) connected to the relay that controls the central heating, and a separate portable Raspberry Pi Zero W as the temperature sensor. (In the near future, I may simplify this setup and utilise a microcontroller.) 

[-Full write-up of initial build-](https://python.plainenglish.io/building-a-smart-central-heating-system-with-a-raspberry-pi-and-python-403c6ea0fd7e)

###### Main server
1. Clone the repository
2. Create log file at `/var/log/smarthome/heating.log`
3. Create a simple shared password for the main app screen and generate an MD5 hash to store in `credentials_funcs.py` (This is how the password will be sent from the frontend and will need to match the hash)
4. To use keep notes functionality edit `Creds` class in `credentials_funcs.py` and run this script as `'__main__'` to encrypt/store password using my poor but passable password encryption (feel free to adjust the `encode_pw`/`decode_pw` functions in `credentials_funcs.py`).
5. Install requirements: `pip install -r requirements.txt`
6. Run as module from outside the main folder: `python3 -m SmartHomeApp.smarthome_server` or `gunicorn -k SmartHomeApp/gunicorn.conf.py SmartHomeApp.smarthome_server:app`

__N.B.__ Music over bluetooth (`mpv`) functionality currently only works when running with Flask dev server (werkzeug) in the foreground (i.e. not working when run through `Supervisord` / `Gunicorn` / `Nginx` etc -- work in progress), and your main server machine must already be connected to your bluetooth speaker device.
Additional requirement: `sudo apt install libmpv-dev` or similar depending on your distro.

###### Temperature sensor
1. copy `temp_api.py` and `network_check.sh` to the temperature sensor machine (in my case, the Pi Zero W)
2. set up BME280 or similar temperature sensor module with GPIO pins according to pins used in `temp_api.py` (or adjust code to reflect pins you use)
3. `pip3 install flask`
4. make `network_check.sh` executable (`chmod +x`) and add to your cron tab (this will solve the problem of your Pi Zero W shutting off wifi to save power, you should also disable power saving in the wifi settings, but this was not a complete fix for me, hence the shell script.)
