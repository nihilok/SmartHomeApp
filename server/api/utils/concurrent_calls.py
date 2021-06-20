import concurrent.futures
import json

import requests
import urllib.parse as urlparse

CONNECTIONS = 100
TIMEOUT = 5

urls = {
    'temperature': 'https://api.smarthome.mjfullstack.com',
    'ip': 'https://api.smarthome.mjfullstack.com/ip',
    'weather': 'https://api.openweathermap.org/data/2.5/onecall'
               '?lat=51.6862&lon=-1.4129&exclude=minutely,hourly'
               '&units=metric&appid=3e315e2a2614af590c8a7a1d8ede1b9c'
}


def decode_json(data):
    if data.startswith('{'):
        data = json.loads(data)
    return data


def load_url(url, timeout):
    ans = requests.get(url, timeout=timeout)
    return url, decode_json(ans.text)


def get_data() -> dict:
    out = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONNECTIONS) as executor:
        future_to_url = (executor.submit(load_url, url, TIMEOUT) for key, url in urls.items() if key != 'weather')
        for future in concurrent.futures.as_completed(future_to_url):
            try:
                data = future.result()
            except Exception as exc:
                data = ('error', str(type(exc)))
            finally:
                out[urlparse.urlparse(data[0]).netloc + urlparse.urlparse(data[0]).path] = [data[1]]
    return out
