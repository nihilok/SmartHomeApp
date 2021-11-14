import * as React from "react";
import "./heating.css";
import { Box, Button, Slider, Stack, Switch } from "@mui/material";
import { useFetchWithToken } from "../../hooks/FetchWithToken";
import classNames from "classnames";
import { StyledTextField } from "../Custom/StyledTextField";
import { FullScreenLoader } from "../Loaders/FullScreenLoader";

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

  interface RelayOnResponseKey {
    on?: boolean;
  }

  type Data = typeof initialState &
    OverrideResponseKey &
    CurrentTempResponseKey &
    RelayOnResponseKey;

  const fetch = useFetchWithToken();

  const [state, setState] = React.useState(initialState);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentTemp, setCurrentTemp] = React.useState<number>();
  const [relayOn, setRelayOn] = React.useState(false);
  const [firstLoad, setFirstLoad] = React.useState(true);
  const [override, setOverride] = React.useState<Override>({
    on: false,
  });

  const debounce = React.useCallback(() => {
    clearTimeout(timeoutRef.current as ReturnType<typeof setTimeout>);
    timeoutRef.current = setTimeout(() => {
      console.log('Updating settings')
      setSettings()
        .catch((error) => console.log(error))
        .finally(() => (lockRef.current = true));
    }, 600);
  }, [setSettings])

  function handleSliderChange(event: Event, newValue: number | number[]) {
    setState({ ...state, target: newValue as number });
  }

  function handleProgramChange(event: React.ChangeEvent<HTMLInputElement>) {
    setState({ ...state, program_on: event.target.checked });
  }

  const programLabel = {
    inputProps: { "aria-label": "Heating Program On Off Switch" },
  };

  function handleTimeChange(event: React.ChangeEvent<HTMLInputElement>) {
    setState({ ...state, [event.target.name]: event.target.value });
  }

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

  const getSettings = React.useCallback(async () => {
    console.log('Getting settings')
    await fetch("/heating/conf/")
      .then((res) =>
        res.json().then((data) => {
          if (res.status !== 200) return console.log(data);
          parseData(data);
        })
      )
      .finally(() => {
        lockRef.current = false;
        setIsLoading(false);
      });
  }, [])

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
    await fetch("/heating/advance/60/").then((res) =>
      res.json().then((data) => {
        if (res.status !== 200) {
          console.log(data);
          return;
        }
        setOverride({
          on: true,
          start: data.start,
        });
      })
    );
  }

  function parseTimes(on: string, off: string, timeNow: Date) {
    const on_diff = timeNow.getHours() - parseInt(on.split(":")[0]);
    if (on_diff < 0) return false;
    if (on_diff < 1)
      if (parseInt(on.split(":")[1]) > timeNow.getMinutes()) return false;
    const off_diff = parseInt(off.split(":")[0]) - timeNow.getHours();
    if (off_diff < 0) return false;
    if (off_diff < 1)
      if (parseInt(off.split(":")[1]) < timeNow.getMinutes()) return false;
    return true;
  }

  const overrideDisabled = () => {
    const timeNow = new Date();
    switch (true) {
      case parseTimes(state.on_1, state.off_1, timeNow):
        return true;
      case parseTimes(state.on_2, state.off_2, timeNow):
        return true;
      default:
        return false;
    }
  };

  React.useEffect(() => {
    getSettings().catch((error) => console.log(error));
    setFirstLoad(false);
  }, [getSettings]);

  React.useEffect(() => {
    if (!firstLoad) {
      if (!lockRef.current) {
        debounce();
      }
      lockRef.current = false;
    }
    return () => {
      lockRef.current = true;
      clearTimeout(timeoutRef.current as ReturnType<typeof setTimeout>)
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
      5000
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <form className="heating-settings">
      <Box>
        {isLoading ? (
          <FullScreenLoader />
        ) : (
          <>
            <h1>Heating Settings</h1>
            {currentTemp && (
              <h1
                className={classNames("TempDisplay", {
                  TempDisplay__On: relayOn,
                })}
              >
                {currentTemp.toFixed(1)}&deg;C
              </h1>
            )}
            <Stack
              spacing={2}
              direction="row"
              sx={{ mb: 3 }}
              alignItems="center"
              justifyContent="center"
            >
              <h2>Target:</h2>
              <Slider
                aria-label="Target Temperature"
                value={state.target}
                onChange={handleSliderChange}
                min={10}
                max={28}
              />
              <h2>{state.target}&deg;C</h2>
            </Stack>

            <Stack
              spacing={2}
              direction="row"
              sx={{ mb: 5 }}
              alignItems="center"
              justifyContent="space-evenly"
              className={"TimeInputRow"}
            >
              <StyledTextField
                label="On 1"
                name="on_1"
                type="time"
                value={state.on_1}
                InputLabelProps={{
                  shrink: true,
                }}
                required={true}
                onChange={handleTimeChange}
              />
              <div className="arrow right" />
              <StyledTextField
                label="Off 1"
                name="off_1"
                type="time"
                value={state.off_1}
                required={true}
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
              className={"TimeInputRow"}
            >
              <StyledTextField
                label="On 2"
                name="on_2"
                type="time"
                value={state.on_2}
                InputLabelProps={{
                  shrink: true,
                }}
                onChange={handleTimeChange}
              />
              <div className="arrow right" />
              <StyledTextField
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
              direction="column"
              sx={{ mb: 2 }}
              alignItems="center"
              justifyContent="center"
            >
              <Stack
                spacing={2}
                direction="row"
                sx={{ mb: 0 }}
                alignItems="center"
                justifyContent="center"
              >
                <Button
                  variant={override.on ? "contained" : "outlined"}
                  disabled={overrideDisabled()}
                  onClick={handleOverride}
                >
                  {override.on ? "Cancel Override" : "1hr Override"}
                </Button>
              </Stack>
              {override.start && (
                <p className="text-muted">
                  on until{" "}
                  {new Date(
                    (override.start + 3600) * 1000
                  ).toLocaleTimeString()}
                </p>
              )}
            </Stack>
          </>
        )}
      </Box>
    </form>
  );
}
