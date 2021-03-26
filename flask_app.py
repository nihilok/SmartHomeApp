#!/usr/bin/env python3
import os
import signal
import subprocess
import time
from threading import Thread

from flask import Flask, redirect, url_for, render_template, request, session, jsonify, make_response

from .heating import Heating
from .weather import get_current_data

app = Flask(__name__)

hs = Heating()


@app.route('/heating')
def home():
    if 'verified' in session:
        start_time = hs.start_time() if hs.advance else None
        return render_template('heating.html', on=hs.on, relay_on=hs.check_state(),
                               current_temp=int(hs.check_temperature()), desired_temp=int(hs.desired_temperature),
                               advance=hs.advance, time=start_time,
                               )
    return redirect(url_for('login'))


@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        if 'verified' in session:
            return redirect(url_for('menu'))
        return render_template('login.html')
    else:
        name = request.form.get('name')
        if name == 'eima':
            session['verified'] = True
            return redirect(url_for('menu'))
        else:
            hs.logger.warning('incorrect password entered')
            return render_template('login.html', message='You are not allowed to enter.')


@app.route('/menu')
def menu():
    if 'verified' in session:
        return render_template('menu.html')
    return redirect(url_for('login'))


@app.route('/on')
def on():
    if 'verified' in session:
        hs.thermostat_thread()
        return redirect(url_for('home'))
    return redirect(url_for('login'))


@app.route('/off')
def off():
    if 'verified' in session:
        hs.stop_thread()
        hs.advance = False
        hs.advance_start_time = None
        return redirect(url_for('home'))
    return redirect(url_for('login'))


def advance_thread():
    interrupt = False
    if hs.tstat:
        hs.tstat = False
        interrupt = True
    hs.switch_on_relay()
    time.sleep(1800)
    hs.switch_off_relay()
    hs.advance = False
    hs.advance_start_time = None
    hs.on = False
    if interrupt:
        hs.thermostat_thread()


@app.route('/advance')
def advance():
    hs.on = True
    hs.advance = True
    t1 = Thread(target=advance_thread)
    t1.daemon = True
    t1.start()
    return redirect(url_for('home'))


@app.route('/settings', methods=['GET', 'POST'])
def settings():
    if request.method == 'GET':
        if 'verified' in session:
            return render_template('settings.html', des_temp=hs.desired_temperature, timer_prog=hs.timer_program)
        return render_template('login.html')
    else:
        interrupt = False
        if hs.tstat:
            hs.tstat = False
            interrupt = True
        des_temp = request.form.get('myRange')
        on_1 = request.form.get('on_1')
        off_1 = request.form.get('off_1')
        on_2 = request.form.get('on_2')
        off_2 = request.form.get('off_2')
        new_timer_prog = {
            'on_1': on_1,
            'off_1': off_1,
            'on_2': on_2,
            'off_2': off_2
        }
        hs.desired_temperature = des_temp
        hs.timer_program = new_timer_prog
        hs.save_state_thread()
        if interrupt:
            hs.thermostat_thread()
        return redirect(url_for('home'))


@app.route('/temp', methods=['GET'])
def fetch_temp():
    response = make_response(jsonify({"temp": int(hs.check_temperature()),
                                      "on": hs.check_state()}), 200)
    return response


@app.route('/weather')
def fetch_weather():
    current_weather = get_current_data()
    weather_string = f"<nobr>{current_weather['temp']}, {current_weather['feels']}, {current_weather['wind']}</nobr>"
    response = make_response(jsonify({"weather": weather_string}, 200))
    return response


STATION_URLS = {
    'heart 80s': 'http://media-ice.musicradio.com/Heart80sMP3',
    'el sol': 'https://playerservices.streamtheworld.com/api/livestream-redirect/EL_SOL_BOGAAC.aac'
}

stream = None


def kill_station():
    global stream
    try:
        os.kill(stream.pid, signal.SIGTERM)
    except Exception as e:
        print(e)


def play_radio_station(station):
    # kill_station()
    global stream
    stream = subprocess.Popen(['mpv', STATION_URLS[station], '&'])


@app.route('/radio', methods=['GET', 'POST'])
def radio():
    if request.method == 'POST':
        if 'kill' in request.get_json().keys():
            kill_station()
            return render_template('radio.html')
        play_radio_station(request.get_json()['station'])
    return render_template('radio.html')


@app.errorhandler(404)
def page_not_found(e):
    return redirect(url_for('home'))


if __name__ == '__main__':
    app.secret_key = 'SECRET KEY'
    app.run(debug=True, host='0.0.0.0', port=5000)
