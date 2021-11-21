import requests

BOT_TOKEN = "<BOT_TOKEN>"
CHANNEL_ID = "<CHANNEL_ID>"


def send_message(message):
    requests.get(
        f"https://api.telegram.org/bot{BOT_TOKEN}/"
        f"sendMessage?chat_id={CHANNEL_ID}&text={message}"
    )


if __name__ == "__main__":
    send_message("It works!")
