#!/bin/bash

source #path/to/env/bin/activate ;
cd #path/to/server/ ;
exec uvicorn api.server:app ;
