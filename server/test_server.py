from flask import Flask, make_response, jsonify
from flask_cors import CORS, cross_origin


app = Flask(__name__)
app.secret_key = 'iamsupersecret1234'

app = Flask(__name__)
cors = CORS(app, resources={r"/api/tasks": {"origins": "http://localhost:3000"}})
app.config['CORS_HEADERS'] = 'Content-Type'

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

@app.route('/api/tasks', methods=['GET', 'POST', 'DELETE'])
@cross_origin(origin='192.168.1.*',headers=['Content- Type','Authorization'])
def tasks_api():
    conn = sqlite3.connect('test.db')
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
        # flash('Task added')
    elif request.method == 'DELETE':
        curs.execute(f'DELETE FROM tasks WHERE task_id = {request.get_json().get("id")}')
        conn.commit()
        all_tasks = get_all_tasks(curs)
        # flash('Task removed')
    task_dict = parse_tasks(all_tasks)
    conn.close()
    return make_response(jsonify(task_dict))


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)