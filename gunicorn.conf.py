from .smarthome_server import heating_init

bind = '0.0.0.0:8080'
workers = 3
worker_class = 'gthread'
loglevel = 'info'


def on_starting(server):
    heating_init()


