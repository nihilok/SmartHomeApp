import * as React from 'react';

interface WeatherJson {
    temperature: number;
    pressure: number;
    humidity: number;
}

interface Props {
    readings: WeatherJson;
}

export function Barometer({readings}: Props) {
    return (
        <div>
            <p>Pressure: {(readings.pressure).toFixed(2)} hPa</p>
            <p>Humidity: {(readings.humidity).toFixed(2)}%</p>
        </div>
    );
}