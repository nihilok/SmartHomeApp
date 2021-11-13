import * as React from "react";
import "./heating.css";
import { Box, Slider, Stack, Switch, TextField } from "@mui/material";
import { useFetchWithToken } from "../../hooks/FetchWithToken";
import classNames from "classnames";

export function SettingsForm() {
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();
  const lockRef = React.useRef<boolean>(true);

  const initialState = {
    target: 20,
    program_on: true,
    on_1: "",
    off_1: "",
    on_2: "",
    off_2: "",
  };

  interface Override {
    start?: number;
    on: boolean;
  }

  interface OverrideResponseKey {
    advance?: Override;
  }

  interface CurrentTempResponseKey {
    current?: number;
  }

  interface CurrentTempResponseKey {
    on?: boolean;
  }

  const [state, setState] = React.useState(initialState);
  const [currentTemp, setCurrentTemp] = React.useState<number>();
  const [relayOn, setRelayOn] = React.useState(false);
  const [firstLoad, setFirstLoad] = React.useState(true);
  const [override, setOverride] = React.useState<Override>({
    on: false,
  });

  function debounce() {
    clearTimeout(timeoutRef.current as ReturnType<typeof setTimeout>);
    timeoutRef.current = setTimeout(() => {
      console.log("Updating");
      setSettings()
        .catch((error) => console.log(error))
        .finally(() => (lockRef.current = true));
    }, 600);
  }

  function handleSliderChange(event: Event, newValue: number | number[]) {
    setState({ ...state, target: newValue as number });
  }

  function handleProgramChange(event: React.ChangeEvent<HTMLInputElement>) {
    setState({ ...state, program_on: event.target.checked });
  }

  const programLabel = {
    inputProps: { "aria-label": "Heating Program On Off Switch" },
  };

  const overrideLabel = {
    inputProps: { "aria-label": "30 minutes program override" },
  };

  function handleTimeChange(event: React.ChangeEvent<HTMLInputElement>) {
    setState({ ...state, [event.target.name]: event.target.value });
  }

  const fetch = useFetchWithToken();

  type Data = typeof initialState &
    OverrideResponseKey &
    CurrentTempResponseKey;

  function parseData(data: Data) {
    const { on_1, off_1, on_2, off_2, program_on, target } = data;
    setState({
      on_1,
      off_1,
      on_2,
      off_2,
      program_on,
      target,
    });
    if (data.advance) setOverride(data.advance ?? { on: false });
    if (data.current) setCurrentTemp(data.current);
    if (data.on !== undefined) setRelayOn(data.on);
  }

  async function getSettings() {
    await fetch("/heating/conf/")
      .then((res) =>
        res.json().then((data) => {
          if (res.status !== 200) return console.log(data);
          parseData(data);
        })
      )
      .finally(() => {
        lockRef.current = false;
      });
  }

  async function setSettings() {
    await fetch("/heating/", "POST", state).then((res) =>
      res.json().then((data) => {
        if (res.status !== 200) {
          parseData(data);
        } else {
          if (data !== state) setState(data);
        }
      })
    );
  }

  async function handleOverride() {
    if (override.on) {
      return await fetch("/heating/cancel/").then(() =>
        setOverride({ on: false })
      );
    }
    await fetch("/heating/advance/30/").then((res) =>
      res.json().then((data) => {
        if (res.status !== 200) {
          console.log(data);
          return;
        }
        console.log(data.start);
        setOverride({
          on: true,
          start: data.start,
        });
      })
    );
  }

  React.useEffect(() => {
    getSettings().catch((error) => console.log(error));
    setFirstLoad(false);
  }, []);

  React.useEffect(() => {
    if (!firstLoad) {
      if (!lockRef.current) {
        debounce();
      }
      lockRef.current = false;
    }
  }, [state]);

  React.useEffect(() => {
    let interval = setInterval(
      () =>
        fetch("/heating/info/").then((res) =>
          res.json().then((data) => {
            if (res.status !== 200) return console.log(data);
            setCurrentTemp(data.temp_float);
            setRelayOn(data.on);
          })
        ),
      2000
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <form className="heating-settings">
      <Box>
        <h1>Heating Settings</h1>
        {currentTemp && (
          <h1
            className={classNames("TempDisplay", {
              TempDisplay__On: relayOn,
            })}
          >
            {currentTemp}&deg;C
          </h1>
        )}
        <Stack
          spacing={2}
          direction="row"
          sx={{ mb: 3, px: 5 }}
          alignItems="center"
          justifyContent="center"
        >
          <h2>Target:</h2>
          <Slider
            aria-label="Target Temperature"
            value={state.target}
            onChange={handleSliderChange}
            min={5}
            max={30}
          />
          <h2>{state.target}&deg;C</h2>
        </Stack>

        <Stack
          spacing={2}
          direction="row"
          sx={{ mb: 5 }}
          alignItems="center"
          justifyContent="space-evenly"
        >
          <TextField
            label="On 1"
            name="on_1"
            type="time"
            value={state.on_1}
            InputLabelProps={{
              shrink: true,
            }}
            onChange={handleTimeChange}
          />
          <TextField
            label="Off 1"
            name="off_1"
            type="time"
            value={state.off_1}
            InputLabelProps={{
              shrink: true,
            }}
            onChange={handleTimeChange}
          />
        </Stack>
        <Stack
          spacing={2}
          direction="row"
          sx={{ mb: 3 }}
          alignItems="center"
          justifyContent="space-evenly"
        >
          <TextField
            label="On 2"
            name="on_2"
            type="time"
            value={state.on_2}
            InputLabelProps={{
              shrink: true,
            }}
            onChange={handleTimeChange}
          />
          <TextField
            label="Off 2"
            type="time"
            name="off_2"
            value={state.off_2}
            InputLabelProps={{
              shrink: true,
            }}
            onChange={handleTimeChange}
          />
        </Stack>
        <Stack
          spacing={2}
          direction="row"
          sx={{ mb: 1 }}
          alignItems="center"
          justifyContent="center"
        >
          <h2>Program:</h2>
          <Switch
            {...programLabel}
            onChange={handleProgramChange}
            checked={state.program_on}
          />
          <h2>{state.program_on ? "On" : "Off"}</h2>
        </Stack>
        <Stack
          spacing={2}
          direction="row"
          sx={{ mb: -2 }}
          alignItems="center"
          justifyContent="center"
        >
          <h2>Override:</h2>
          <Switch
            {...overrideLabel}
            onChange={handleOverride}
            checked={override.on}
          />
          <h2>{override.on ? "On" : "Off"}</h2>
        </Stack>
        {override.start && (
          <p>
            until{" "}
            {new Date((override.start + 3600) * 1000).toLocaleTimeString()}
          </p>
        )}
      </Box>
    </form>
  );
}
