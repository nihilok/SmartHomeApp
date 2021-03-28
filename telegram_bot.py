import requests

BOT_TOKEN = '<YOUR BOT TOKEN HERE>'
CHANNEL_ID = '<YOUR CHAT ID HERE>'


def send_message(message):
    requests.get(f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage?chat_id={CHANNEL_ID}&text={message}')


if __name__ == '__main__':
    send_message('It works!')