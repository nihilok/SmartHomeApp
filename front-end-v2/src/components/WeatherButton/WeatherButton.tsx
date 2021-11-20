import * as React from "react";
import "./weather-button.css";
import { ClickAwayListener, IconButton } from "@mui/material";
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
  const [weather, setWeather] = React.useState<Weather>();

  const fetch = useFetchWithToken();

  async function getWeather() {
    await fetch("/weather/").then((res) =>
      res.json().then((data) => {
        setWeather(data);
      })
    );
  }

  const handleTooltipClose = () => {
    setOpen(false);
  };

  const handleTooltipOpen = () => {
    setOpen(true);
    getWeather().catch((err) => console.log(err));
  };

  const content = (
    <>
      <h3>Weather</h3>
      <p>Outdoor Temperature: {weather?.current.temp}&deg;C</p>
      <p>Feels Like: {weather?.current.feels_like}&deg;C</p>
      <p>
        Weather: {weather?.current.weather[0]?.main} (
        {weather?.current.weather[0]?.description})
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
            sx={{mt: .1, ml: -.2}}
            color={open ? "primary" : "default"}
            aria-label="help"
            component="div"
          >
            <img className={'weather-icon'}
              src={`https://openweathermap.org/img/wn/${
                weather ? weather.current.weather[0].icon : "02d"
              }@2x.png`}
            />
          </IconButton>
        </StyledTooltip>
      </div>
    </ClickAwayListener>
  );
}
