import sqlite3
from getpass import getpass

superusers = [1]

def tx_recipe_table():
    conn1 = sqlite3.connect('smarthome.sqlite.db')
    conn2 = sqlite3.connect('db.sqlite3')
    curs1 = conn1.cursor()
    curs2 = conn2.cursor()

    recipes = curs1.execute('SELECT * FROM recipes')
    recipes = [r for r in recipes]

    for recipe in recipes:
        cols = f'(meal_name, ingredients{", notes" if recipe[3] else ""})'
        if not recipe[3]:
            vals = f'("{recipe[1]}", "{recipe[2]}")'
        else:
            vals = f'("{recipe[1]}", "{recipe[2]}", "{recipe[3]}")'
        curs2.execute(f'INSERT INTO recipe {cols} VALUES {vals};')
        conn2.commit()
    conn1.close()
    conn2.close()


def new_user():
    name = input('name: ')
    password = getpass('password: ')
    conn = sqlite3.connect('server/api/db/db.sqlite3')
    curs = conn.cursor()
    vals = f'("{name}", "{password}", 1)'
    curs.execute(f'INSERT INTO householdmember VALUES {vals}')
    conn.commit()
    conn.close()
