import requests

BOT_TOKEN = '1649361432:AAFGAirkXVJhimV5kY6hgikuJEZAw0h8RNE' # the one you saved in previous step
CHANNEL_ID = '-1001477885348' # don't forget to add this

def send_message(message):
    requests.get(f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage?chat_id={CHANNEL_ID}&text={message}')

if __name__ == '__main__':
    send_message('it works!')