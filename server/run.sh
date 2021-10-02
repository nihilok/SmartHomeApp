#!/bin/bash

cd /home/$USER/apps/smarthome/server ;
exec python3 -m venv venv ;
source venv/bin/activate ;
exec pip3 install -r requirements.txt ;
exec uvicorn api.api.server:app ;
