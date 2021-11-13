import * as React from "react";
import "./heating.css";
import { Box, Slider, Stack, Switch, TextField } from "@mui/material";
import { useFetchWithToken } from "../../hooks/FetchWithToken";

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
    start?: Date;
    on: boolean;
  }

  const [state, setState] = React.useState(initialState);
  const [firstLoad, setFirstLoad] = React.useState(true);
  const [override, setOverride] = React.useState<Override>({
    on: false,
  })

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

  function handleTimeChange(event: React.ChangeEvent<HTMLInputElement>) {
    setState({ ...state, [event.target.name]: event.target.value });
  }

  const fetch = useFetchWithToken();

  async function getSettings() {
    await fetch("/heating/conf/")
      .then((res) =>
        res.json().then((data) => {
          res.status !== 200 ? console.log(data) : setState(data);
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
          console.log(data);
        } else {
          if (data !== state) setState(data);
        }
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

  return (
    <form className="heating-settings">
      <Box>
        <h1>Heating Settings</h1>
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
          sx={{ mb: 1 }}
          alignItems="center"
          justifyContent="center"
        >
          <h2 style={{color: 'var(--muted)'}}>Override:</h2>
          <Switch
            {...programLabel}
            onChange={handleProgramChange}
            checked={override.on}
          />
          <h2 style={{color: 'var(--muted)'}}>{override.on ? "On" : "Off"}</h2>
        </Stack>
      </Box>
    </form>
  );
}
