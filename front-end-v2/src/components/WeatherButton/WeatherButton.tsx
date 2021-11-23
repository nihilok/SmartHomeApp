import * as React from "react";
import "./weather-button.css";
import { CircularProgress, ClickAwayListener, IconButton } from "@mui/material";
import { StyledTooltip } from "../Custom/StyledTooltip";
import { useFetchWithToken } from "../../hooks/FetchWithToken";

export function WeatherButton() {
  interface WeatherDict {
    main: string;
    description: string;
    icon: string;
  }

  interface WeatherDay {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: number;
    feels_like: number;
    wind_speed: number;
    weather: WeatherDict[];
  }

  interface Weather {
    current: WeatherDay;
    daily: WeatherDay[];
  }

  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [weather, setWeather] = React.useState<Weather>();
  const [sunrise, setSunrise] = React.useState<string>();
  const [sunset, setSunset] = React.useState<string>();

  const fetch = useFetchWithToken();

  const getWeather = React.useCallback(async () => {
    await fetch("/weather/").then((res) =>
      res.json().then((data) => {
        setWeather(data);
        let img = new Image();
        img.src = `https://openweathermap.org/img/wn/${data.current.weather[0].icon}@2x.png`;
        img.onload = () => setIsLoading(false);
      })
    );
  }, [fetch]);

  const handleTooltipClose = () => {
    setOpen(false);
  };

  const weatherCallback = React.useCallback(() => {
    getWeather().catch((err) => console.log(err));
  }, [getWeather]);

  const handleTooltipOpen = () => {
    setOpen(true);
    weatherCallback();
  };

  React.useEffect(() => {
    weatherCallback();
  }, [weatherCallback]);

  React.useEffect(() => {
    const riseDate = new Date(weather?.current?.sunrise as number * 1000)
    const setDate = new Date(weather?.current?.sunset as number * 1000)

    let riseMins: string | number = riseDate.getMinutes()
    let setMins: string | number = setDate.getMinutes()

    if (riseMins < 10) riseMins = `0${riseMins}`
    if (setMins < 10) setMins = `0${setMins}`

    setSunrise(`${riseDate.getHours()}:${riseMins}`);
    setSunset(`${setDate.getHours()}:${setMins}`);
  }, [weather?.current?.sunrise, weather?.current?.sunset]);

  const content = (
    <>
      <h3>Weather</h3>
      <p>Outdoor Temperature: {weather?.current?.temp}&deg;C</p>
      <p>Feels Like: {weather?.current?.feels_like}&deg;C</p>
      <p>
        Weather: {weather?.current?.weather[0]?.main} (
        {weather?.current?.weather[0]?.description}){" "}
      </p>
      <p>
        Sunrise/set: {sunrise} / {sunset}
      </p>
    </>
  );

  return (
    <ClickAwayListener onClickAway={handleTooltipClose}>
      <div>
        <StyledTooltip
          PopperProps={{
            disablePortal: true,
          }}
          onClose={handleTooltipClose}
          open={open}
          placement={"right-end"}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          title={content}
        >
          <IconButton
            onClick={handleTooltipOpen}
            sx={{ mt: 0.1, ml: -0.2 }}
            color={open ? "primary" : "default"}
            aria-label="help"
            component="div"
          >
            {isLoading ? (
              <CircularProgress size={20} sx={{ m: 1 }} />
            ) : (
              <img
                className={"weather-icon"}
                src={`https://openweathermap.org/img/wn/${
                  weather ? weather.current.weather[0].icon : "02d"
                }@2x.png`}
                alt={"Icon displaying current weather"}
              />
            )}
          </IconButton>
        </StyledTooltip>
      </div>
    </ClickAwayListener>
  );
}
