import * as React from 'react';
import './weather-button.css'
import {ClickAwayListener, IconButton} from "@mui/material";
import {StyledTooltip} from "../Custom/StyledTooltip";
import CloudIcon from '@mui/icons-material/Cloud';
import {useFetchWithToken} from "../../hooks/FetchWithToken";

export function WeatherButton() {
  const [open, setOpen] = React.useState(false);

  const handleTooltipClose = () => {
    setOpen(false);
  };

  const handleTooltipOpen = () => {
    setOpen(true);
  };

  interface WeatherDict {
      main: string;
      description: string;
  }

  interface WeatherDay {
      dt: number;
      sunrise: number;
      sunset: number;
      temp: number
      feels_like: number;
      wind_speed: number;
      weather: WeatherDict[];
  }

  interface Weather {
    current: WeatherDay;
    daily: WeatherDay[];
  }

  const [weather, setWeather] = React.useState<Weather>();

  const fetch = useFetchWithToken();

  React.useEffect(() => {
      fetch('/weather/').then((res) => res.json().then((data)=>{
          setWeather(data)
      }))
  }, [])

  const content =
      <>
        <h3>Weather</h3>
        <p>Outdoor Temperature: {weather?.current.temp}&deg;C</p>
        <p>Feels Like: {weather?.current.feels_like}&deg;C</p>
        <p>Weather: {weather?.current.weather[0]?.main} ({weather?.current.weather[0]?.description})</p>
      </>

  return (
    <ClickAwayListener onClickAway={handleTooltipClose}>
      <div>
        <StyledTooltip
          PopperProps={{
            disablePortal: true,
          }}
          onClose={handleTooltipClose}
          open={open}
          placement={'right'}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          title={content}
        >
          <IconButton
            onClick={handleTooltipOpen}
            className={"weather-button"}
            color={open ? "primary" : "default"}
            aria-label="help"
            component="div"
          >
            <CloudIcon />
          </IconButton>
        </StyledTooltip>
      </div>
    </ClickAwayListener>
  );
}