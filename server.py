import concurrent.futures
import json
import sqlite3
import urllib.parse as urlparse
from datetime import datetime, timedelta
from functools import wraps

import mpv
import requests
from flask import Flask, request, make_response, jsonify, render_template, redirect, url_for, flash, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO

from .credentials_funcs import hash
from .heating import HeatingSystem
from .utils import GradientShifter

app = Flask(__name__)
app.secret_key = hash
socketio = SocketIO(app, cors_allowed_origins=['https://smarthome.mjfullstack.com'])
cors = CORS(app)
hs = HeatingSystem()

STATION_URLS = {
    'heart 80s': 'http://media-ice.musicradio.com/Heart80sMP3',
    'el sol': 'https://playerservices.streamtheworld.com/api/livestream-redirect/EL_SOL_BOGAAC.aac'
}

stream = mpv.MPV()


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.cookies.get('verified', None) is None:
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)

    return decorated_function


CONNECTIONS = 100
TIMEOUT = 5

urls = [hs.SENSOR_IP,
        'http://api.ipstack.com/check?access_key=cbcc8b556db35ab071f29e75d7ae32f6&output=json&fields=ip',
        'https://api.openweathermap.org/data/2.5/onecall?lat=51.6862&lon=-1.4129&exclude=minutely,hourly'
        '&units=metric&appid=9fa343773117603702a3f91a62e14ee4']


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


@app.route('/api')
def api(internal=False):
    out = get_data()
    temp_url = urlparse.urlparse(urls[0]).netloc
    ip_url = urlparse.urlparse(urls[1]).netloc
    weather_url = urlparse.urlparse(urls[2]).netloc
    try:
        info = {
            'indoor_temp': str('{0:.1f}'.format(out[temp_url][0]['temperature'])) + '°C',
            'outdoor_temp': str(out[weather_url][0]['current']['temp']) + '°C',
            'weather': out[weather_url][0]['current']['weather'][0]['description'],
            'on': True if hs.check_state() else False,
            'redValue': GradientShifter.return_red_value(out[temp_url][0]['temperature'])
        }
    except KeyError:
        info = {
            'indoor_temp': str('{0:.1f}'.format(out[temp_url][0]['temperature'])) + '°C',
            'outdoor_temp': '- -' + '°C',
            'weather': '- -',
            'on': True if hs.check_state() else False,
            'redValue': GradientShifter.return_red_value(out[temp_url][0]['temperature'])
        }
    try:
        info['external_ip'] = out[ip_url][0]['ip']
    except KeyError:
        info['external_ip'] = None
    if not internal:
        response = make_response(jsonify(info), 202)
        return response
    return info


@app.route('/')
@login_required
def index():
    info = {'current_time': (datetime.now() + timedelta(hours=1)).strftime('%H:%M:%S')}
    return render_template('home_screen.html', info=info)


@app.route('/forbidden')
def forbidden():
    return render_template('forbidden.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        form_data = request.get_json()
        if form_data.get('passwd') is not None and form_data['passwd'] == hash:
            res = make_response(jsonify({'redirect_url': url_for('index')}))
            res.set_cookie('verified', 'true', expires=(datetime.now() + timedelta(days=5)))
            return res
        else:
            return make_response(jsonify({'redirect_url': url_for('forbidden')}))
    return render_template('login.html')


@app.route('/heating')
@login_required
def heating():
    info = api(internal=True)
    res = render_template(
        'heating.html',
        info=info,
        gradient=info['redValue'],
        on=hs.conf['program_on'],
        relay_on=hs.check_state(),
        desired_temp=int(hs.conf['target']),
        back=True,
        settings=True
    )
    return res


@app.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    if request.method == 'GET':
        return render_template('settings.html',
                               des_temp=hs.conf['target'],
                               timer_prog=hs.conf['program'],
                               back=True,
                               settings=False)
    elif request.method == 'POST':
        changed = False
        if any(
                [request.form.get('on_1') != hs.conf['program']['on_1'],
                 request.form.get('on_2') != hs.conf['program']['off_1'],
                 request.form.get('on_2') != hs.conf['program']['on_2'],
                 request.form.get('off_2') != hs.conf['program']['off_2']]
        ):
            hs.change_times(request.form.get('on_1'),
                            request.form.get('off_1'),
                            request.form.get('on_2'),
                            request.form.get('off_2'))
            changed = True
        if request.form.get('myRange') != hs.conf['target']:
            hs.change_temp(request.form.get('myRange'))
            changed = True
        if changed:
            flash('Settings changed')
            hs.main_loop()
        else:
            flash('No change')
        return redirect(url_for('heating'))


def heating_program_on_off(value: bool):
    if hs.conf['program_on']:
        if not value:
            hs.program_off()
    else:
        if value:
            hs.program_on()


@app.route('/switch', methods=['POST'])
@login_required
def switch():
    data = request.get_json()
    if data['command'].lower() == 'on':
        heating_program_on_off(True)
    elif data['command'].lower() == 'off':
        heating_program_on_off(False)
    return 'Success', 200


def kill_station():
    global stream
    stream.stop()


def play_radio_station(station):
    global stream
    stream.play(STATION_URLS[station])
    print(f'playing {station}')


@app.route('/music', methods=['GET', 'POST'])
def music():
    if request.method == 'POST':
        if request.get_json() and request.get_json().get('kill'):
            kill_station()
            return 'Success', 200
        play_radio_station(request.get_json()['station'])
        return 'Success', 200
    return render_template('radio.html', back=True)


def get_all_tasks(cursor):
    return list(cursor.execute('SELECT * FROM tasks'))


def parse_tasks(tasks):
    task_dict = {
        'Les': [],
        'Mike': []
    }
    for task in tasks:
        task_dict[task[2]].append((task[0], task[1], task[3]))
    for person in task_dict.keys():
        task_dict[person] = list(reversed(task_dict[person]))
    return task_dict


@app.route('/tasks', methods=['GET', 'POST', 'DELETE'])
@login_required
def tasks():
    conn = sqlite3.connect('smarthome.sqlite.db')
    curs = conn.cursor()
    all_tasks = get_all_tasks(curs)
    if request.method == 'POST':
        if all_tasks:
            next_id = all_tasks[-1][0] + 1
        else:
            next_id = 1
        q = f'INSERT INTO tasks (task_id, task_name, person{", due_date" if request.form.get("date") else ""}) ' \
            f'VALUES ({next_id}, "{request.get_json()["task"]}", "{request.get_json()["person"]}"' \
            f'{", " + chr(22) + request.form.get("date") + chr(22) if request.form.get("date") else ""})'
        curs.execute(q)
        conn.commit()
        all_tasks = get_all_tasks(curs)
        task_dict = parse_tasks(all_tasks)
        # flash('Task added')
        return render_template('tasks_min.html', tasks=task_dict)
    elif request.method == 'DELETE':
        curs.execute(f'DELETE FROM tasks WHERE task_id = {request.get_json().get("id")}')
        conn.commit()
        all_tasks = get_all_tasks(curs)
        task_dict = parse_tasks(all_tasks)
        # flash('Task removed')
        return render_template('tasks_min.html', tasks=task_dict)
    task_dict = parse_tasks(all_tasks)
    conn.close()
    return render_template('tasks.html', tasks=task_dict, back=True)


@app.route('/api/tasks', methods=['GET', 'POST', 'DELETE'])
def tasks_api():
    conn = sqlite3.connect('smarthome.sqlite.db')
    curs = conn.cursor()
    all_tasks = get_all_tasks(curs)
    if request.method == 'POST':
        if all_tasks:
            next_id = all_tasks[-1][0] + 1
        else:
            next_id = 1
        q = f'INSERT INTO tasks (task_id, task_name, person{", due_date" if request.form.get("date") else ""}) ' \
            f'VALUES ({next_id}, "{request.get_json()["task"]}", "{request.get_json()["person"]}"' \
            f'{", " + chr(22) + request.form.get("date") + chr(22) if request.form.get("date") else ""})'
        curs.execute(q)
        conn.commit()
        all_tasks = get_all_tasks(curs)
    elif request.method == 'DELETE':
        curs.execute(f'DELETE FROM tasks WHERE task_id = {request.get_json().get("id")}')
        conn.commit()
        all_tasks = get_all_tasks(curs)
    task_dict = parse_tasks(all_tasks)
    conn.close()
    return make_response(jsonify(task_dict))


@socketio.on('add_task')
def add_task(task):
    conn = sqlite3.connect('smarthome.sqlite.db')
    curs = conn.cursor()
    q = f'INSERT INTO tasks (task_name, person)' \
        f'VALUES ("{task["task"]}", "{task["person"]}");'
    curs.execute(q)
    conn.commit()
    all_tasks = get_all_tasks(curs)
    task_dict = parse_tasks(all_tasks)
    socketio.emit('update_tasks', render_template('tasks_min.html', tasks=task_dict))
    conn.close()


@socketio.on('delete_task')
def delete_task(id):
    conn = sqlite3.connect('smarthome.sqlite.db')
    curs = conn.cursor()
    curs.execute(f'DELETE FROM tasks WHERE task_id = {id}')
    conn.commit()
    all_tasks = get_all_tasks(curs)
    task_dict = parse_tasks(all_tasks)
    socketio.emit('update_tasks', render_template('tasks_min.html', tasks=task_dict))
    conn.close()


@app.route('/shopping', methods=['GET', 'POST', 'DELETE'])
@login_required
def shopping():
    conn = sqlite3.connect('smarthome.sqlite.db')
    curs = conn.cursor()
    get = True
    if request.method == 'POST':
        items = [request.get_json()["item"]]
        if ',' in items[0]:
            items = [i.strip() for i in items[0].split(',')]
        for item in items:
            curs.execute(f'INSERT INTO shopping (item) VALUES ("{item}")')
        conn.commit()
        get = False
        # flash('Item added')
    elif request.method == 'DELETE':
        curs.execute(f'DELETE FROM shopping WHERE id = {request.get_json().get("id")}')
        conn.commit()
        get = False
        # flash('Item removed')
    all_items = list(reversed(list(curs.execute('SELECT * FROM shopping'))))
    if get:
        return render_template('shopping.html', items=all_items, back=True)
    else:
        return render_template('shopping_min.html', items=all_items)


@socketio.on('add_to_shopping_list')
def add_to_shopping_list(items):
    conn = sqlite3.connect('smarthome.sqlite.db')
    curs = conn.cursor()
    if ',' in items:
        items = [i.strip() for i in items.split(',')]
    else:
        items = [items]
    for item in items:
        curs.execute(f'INSERT INTO shopping (item) VALUES ("{item}")')
    conn.commit()
    all_items = list(reversed(list(curs.execute('SELECT * FROM shopping'))))
    socketio.emit('update_items', render_template('shopping_min.html', items=all_items), broadcast=True)
    conn.close()


@socketio.on('delete_from_shopping_list')
def delete_from_shopping_list(item_id):
    conn = sqlite3.connect('smarthome.sqlite.db')
    curs = conn.cursor()
    curs.execute(f'DELETE FROM shopping WHERE id = {item_id}')
    conn.commit()
    all_items = list(reversed(list(curs.execute('SELECT * FROM shopping'))))
    socketio.emit('update_items', render_template('shopping_min.html', items=all_items), broadcast=True)
    print('items updated')
    conn.close()


@app.route('/api/shopping', methods=['GET', 'POST', 'DELETE'])
def shopping_api():
    conn = sqlite3.connect('smarthome.sqlite.db')
    curs = conn.cursor()
    get = True
    if request.method == 'POST':
        items = [request.get_json()["item"]]
        if ',' in items[0]:
            items = [i.strip() for i in items[0].split(',')]
        for item in items:
            curs.execute(f'INSERT INTO shopping (item) VALUES ("{item}")')
        conn.commit()
        get = False
    elif request.method == 'DELETE':
        curs.execute(f'DELETE FROM shopping WHERE id = {request.get_json().get("id")}')
        conn.commit()
        get = False
    all_items = list(reversed(list(curs.execute('SELECT * FROM shopping'))))
    return make_response(jsonify(all_items))


@app.route('/cam')
@login_required
def cam():
    return render_template('cams.html', back=True)


@app.route('/recipes', methods=['GET', 'POST'])
@login_required
def recipes():
    conn = sqlite3.connect('smarthome.sqlite.db')
    curs = conn.cursor()
    if request.method == 'POST':
        data = request.json
        cols = f'(name, ingredients{", notes" if data["notes"] else ""})'
        if not data['notes']:
            vals = f'("{data["meal"]}", "{data["ingredients"]}")'
        else:
            vals = f'("{data["meal"]}", "{data["ingredients"]}", "{data["notes"]}")'
        curs.execute(f'INSERT INTO recipes {cols} VALUES {vals};')
        conn.commit()
        conn.close()
        return make_response(jsonify({'message': 'OK'}))
    recipe_list = curs.execute('SELECT * FROM recipes')
    resp = render_template('food_menu.html', meals=recipe_list, back=True)
    conn.close()
    return resp


@app.route('/files/<path:filename>', methods=['GET'])
def files(filename):
    return send_from_directory('./static/img/icons/', filename)


application = app

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8080)
