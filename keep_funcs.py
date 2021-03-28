from gkeepapi import Keep
from .credentials_funcs import Creds, decode_pw


with open('pw.txt', 'r') as f:
    enc_pw = f.read().strip()
    Creds.pwd = enc_pw


def login():
    keep = Keep()
    keep.login(Creds.gmail, decode_pw(Creds.pwd))
    return keep


def create_keep_note(title='Test', text='test note'):
    keep = login()
    note = keep.createNote(title=title, text=text)
    note.pinned = True
    keep.sync()


def add_to_shopping_list(item: str):
    keep = login()
    klist = keep.get('<SERVER_ID of list from gkeep>')
    klist.add(item, False)
    keep.sync()


if __name__ == '__main__':
    create_keep_note(title=input('Title: '), text=input('Note: '))
