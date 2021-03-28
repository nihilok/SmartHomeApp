import concurrent.futures
import json
import urllib.parse as urlparse
from datetime import datetime, timedelta
from functools import wraps

import mpv
import requests
from flask import Flask, request, make_response, jsonify, render_template, redirect, url_for

from .heating import Heating
from .credentials_funcs import hash
from .keep_funcs import create_keep_note, add_to_shopping_list


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.cookies.get('verified', None) is None:
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)

    return decorated_function


CONNECTIONS = 100
TIMEOUT = 5


urls = ['http://192.168.1.88',
        'http://api.ipify.org',
        'https://api.openweathermap.org/data/2.5/onecall?lat=51.6862&lon=-1.4129&exclude=minutely,hourly&units=metric&appid=9fa343773117603702a3f91a62e14ee4']


def decode_json(data):
    if data.startswith('{'):
        data = json.loads(data)
    return data


def load_url(url, timeout):
    ans = requests.get(url, timeout=timeout)
    return url, decode_json(ans.text)


def get_data():
    out = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONNECTIONS) as executor:
        future_to_url = (executor.submit(load_url, url, TIMEOUT) for url in urls)
        for future in concurrent.futures.as_completed(future_to_url):
            try:
                data = future.result()
            except Exception as exc:
                data = ('error', str(type(exc)))
            finally:
                out[urlparse.urlparse(data[0]).netloc] = [data[1]]
    return out


hs = None
app = Flask(__name__)


# @app.before_first_request
def heating_init():
    global hs
    hs = Heating()


@app.route('/api')
def api(internal=False):
    out = get_data()
    temp_url = urlparse.urlparse(urls[0]).netloc
    ip_url = urlparse.urlparse(urls[1]).netloc
    weather_url = urlparse.urlparse(urls[2]).netloc
    info = {
        'indoor_temp': str('{0:.1f}'.format(out[temp_url][0]['temperature'])) + '°C',
        'outdoor_temp': str(out[weather_url][0]['current']['temp']) + '°C',
        'current_time': datetime.utcnow().strftime('%H:%M'),
        'weather': out[weather_url][0]['current']['weather'][0]['description'],
        'external_ip': out[ip_url][0],
    }
    if not internal:
        response = make_response(jsonify(info), 202)
        return response
    return info


@app.route('/')
@login_required
def index():
    info = api(internal=True)
    return render_template('index.html', info=info)


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        form_data = request.get_json()
        if form_data.get('passwd') == hash:
            res = make_response(jsonify({'redirect_url': url_for('index')}))
            if request.args.get('next'):
                res = make_response(jsonify({'redirect_url': request.args['next']}))
            # noinspection PyTypeChecker
            res.set_cookie('verified', 'true', expires=(datetime.now() + timedelta(days=5)))
            return res
        else:
            return render_template('forbidden.html')
    return render_template('login.html')


@app.route('/heating')
@login_required
def heating():
    # start_time = hs.start_time() if hs.advance else None
    return render_template('heating.html', info=api(internal=True),
                           on=hs.config['program_on'],
                           relay_on=hs.check_state(),
                           desired_temp=int(hs.config['desired'])
                           )


@app.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    if request.method == 'GET':
        return render_template('settings.html', des_temp=hs.config['desired'], timer_prog=hs.config['program'])
    else:
        des_temp = request.form.get('myRange')
        new_timer_prog = {
            'on_1': request.form.get('on_1'),
            'off_1': request.form.get('off_1'),
            'on_2': request.form.get('on_2'),
            'off_2': request.form.get('off_2')
        }
        hs.config['desired'] = des_temp
        hs.config['program'] = new_timer_prog
        hs.save_state()
        if hs.config['program_on']:
            if hs.scheduler.get_jobs():
                hs.change_schedule()
            else:
                hs.start_scheduled_tasks()
            if not hs.check_time() and hs.config['tstat']:
                hs.stop_loop()
            elif hs.check_time() and not hs.config['tstat']:
                hs.thermostat_thread()
        return redirect(url_for('heating'))


STATION_URLS = {
    'heart 80s': 'http://media-ice.musicradio.com/Heart80sMP3',
    'el sol': 'https://playerservices.streamtheworld.com/api/livestream-redirect/EL_SOL_BOGAAC.aac'
}

stream = mpv.MPV()


def kill_station():
    global stream
    stream.stop()


def play_radio_station(station):
    global stream
    print(f'playing {station}')
    stream.play(STATION_URLS[station])


@app.route('/music', methods=['GET', 'POST'])
def music():
    if request.method == 'POST':
        if request.get_json() and request.get_json().get('kill'):
            kill_station()
            return 'Success', 200
        play_radio_station(request.get_json()['station'])
        return 'Success', 200
    return render_template('radio.html')


def heating_program_on_off(value: bool):
    if hs.config['tstat']:
        if not value:
            hs.stop_jobs()
            hs.config['program_on'] = False
    else:
        if value:
            if not hs.scheduler.get_jobs():
                hs.config['program_on'] = True
                hs.start_scheduled_tasks()
            if hs.check_time():
                hs.thermostat_thread()


@app.route('/switch', methods=['POST'])
@login_required
def switch():
    data = request.get_json()
    print(data)
    if data['command'].lower() == 'on':
        heating_program_on_off(True)
    elif data['command'].lower() == 'off':
        heating_program_on_off(False)
    return 'Success', 200


@app.route('/notes', methods=['GET', 'POST'])
@login_required
def notes():
    if request.method == 'POST':
        create_keep_note(request.form['title'], request.form['note'])
    return render_template('notes.html')


@app.route('/shopping', methods=['GET', 'POST'])
@login_required
def shopping():
    if request.method == 'POST':
        add_to_shopping_list(request.form['item'])
        with open('shopping_list.txt', 'a') as f:
            f.write(request.form['item'])
    return render_template('shopping.html')


application = app

if __name__ == '__main__':
    @app.before_first_request
    def heating_init():
        global hs
        hs = Heating()
    app.run(host='0.0.0.0', port=8080)

