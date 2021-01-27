import requests
import json
from datetime import datetime as dt

degree_sign= u'\N{DEGREE SIGN}'

def api_call():
    data = requests.get('https://api.openweathermap.org/data/2.5/onecall?lat=51.6862&lon=-1.4129&exclude=minutely,hourly&units=metric&appid=9fa343773117603702a3f91a62e14ee4')
    return data.text

def get_8_day_data():
    list_8_days = []

    for day in json.loads(api_call())['daily']:
        date = dt.utcfromtimestamp(day['dt']).strftime('%Y-%m-%d')
        precipitation_str = f'Precipitation: {int(int(day["pop"])*100)}%'
        high_temp_str = f'High: {day["temp"]["max"]}{degree_sign}C'
        low_temp_str = f'Low: {day["temp"]["min"]}{degree_sign}C'
        list_8_days.append(
            {
                "date": date,
                "precipitation": precipitation_str,
                "high": high_temp_str,
                "low": low_temp_str,
            }
        )
    return list_8_days


def get_current_data():
    date_time = dt.now().strftime('%Y-%m-%d %H:%M')
    data = api_call()
    weather_str = f"Current weather: {json.loads(data)['current']['weather'][0]['description']}"
    temp_str = f"Outdoor temp: {json.loads(data)['current']['temp']}{degree_sign}C"
    fl_str = f"Feels like: {json.loads(data)['current']['feels_like']}{degree_sign}C"
    w_speed = f"Wind speed: {json.loads(data)['current']['wind_speed']}m/s"
    current_data_dict = {
        'date_time': date_time,
        "weather": weather_str,
        "temp": temp_str,
        "feels": fl_str,
        "wind": w_speed,
    }
    return current_data_dict


def frost_warn():
    for day in get_8_day_data():
        if float(day['low'][5:9]) < 4:
            return True
    return False

def precipitation_warn():
    pass

if __name__ == '__main__':
    print(f"""
    
ALL DATA
````````````````````````````````````
{json.loads(api_call())['current']}
====================================

Daily data:
``````````````````````````````
{get_8_day_data()}
====================================

Current data:
``````````````````````````````
{get_current_data()}
====================================
    """)

# print(frost_warn())
