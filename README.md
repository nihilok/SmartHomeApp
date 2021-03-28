# Smarthome App
### _Central heating system et al._

###### Recent changes:

- `apcheduler` for heating programmer
- ACID-like transaction for heating settings
- `mpv` integration for music over bluetooth
- Keep notes integration (for shopping list etc.)

### Installation:

1. Clone the repository
2. Create log file at `/var/log/smarthome/heating.log`
3. Create a simple shared password for the main app screen and generate an md5sum hash to store in `credentials_funcs.py`
4. To use keep notes functionality edit `Creds` class in `credentials_funcs.py` and run this script as `'__main__'` to encrypt/store password.
5. Music/bluetooth functionality currently only works when running with Flask dev server in the foreground (i.e. not working when run through `Supervisord` / `Gunicorn`)
6. Install requirements: `pip install -r requirements.txt`