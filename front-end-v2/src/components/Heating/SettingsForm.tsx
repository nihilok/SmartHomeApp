import * as React from "react";
import "./heating.css";
import classNames from "classnames";
import { Box, Button, Slider, Stack, Switch } from "@mui/material";
import { StyledTooltip } from "../Custom/StyledTooltip";
import { StyledTextField } from "../Custom/StyledTextField";
import { TEMPERATURE_INTERVAL } from "../../constants/constants";
import { useFetchWithToken } from "../../hooks/FetchWithToken";
import { checkTimeStringWithinLimit } from "../../lib/helpers";
import { FullScreenLoader } from "../Loaders/FullScreenLoader";
import { HelpButton } from "../HelpButton/HelpButton";
import { FullScreenComponent } from "../Custom/FullScreenComponent";
import { ProgramArrow } from "./ProgramArrow";
import { WeatherButton } from "../WeatherButton/WeatherButton";
import { OpenCloseButton } from "./OpenCloseButton";

export function SettingsForm() {
  interface Override {
    start?: number;
    on: boolean;
  }

  interface Sensors {
    temperature: number;
    pressure: number;
    humidity: number;
  }

  interface HeatingConfig {
    target: number;
    on_1: string;
    off_1: string;
    on_2?: string;
    off_2?: string;
    program_on?: boolean;
    advance?: Override;
  }

  interface APIResponse {
    indoor_temperature: number;
    sensor_readings: Sensors;
    relay_on: boolean;
    conf: HeatingConfig;
  }

  type Data = APIResponse;

  const initialState: HeatingConfig = {
    target: 20,
    program_on: true,
    on_1: "",
    off_1: "",
    on_2: "",
    off_2: "",
  };

  const fetch = useFetchWithToken();
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();
  const lockRef = React.useRef(true);
  const firstLoad = React.useRef(true);
  const [config, setConfig] = React.useState(initialState);
  const [isLoading, setIsLoading] = React.useState(true);
  const [helpMode, setHelpMode] = React.useState(false);
  const [row2, setRow2] = React.useState(true);
  const [currentTemp, setCurrentTemp] = React.useState<number>();
  const [relayOn, setRelayOn] = React.useState(false);
  const [override, setOverride] = React.useState<Override>({
    on: false,
  });

  function handleSliderChange(event: Event, newValue: number | number[]) {
    setConfig({ ...config, target: newValue as number });
  }

  const programLabel = {
    inputProps: {
      "aria-label": "Switch between timer program and frost stat mode",
    },
  };

  function handleTimeChange(event: React.ChangeEvent<HTMLInputElement>) {
    setConfig({ ...config, [event.target.name]: event.target.value });
  }

  const parseData = React.useCallback((data: Data) => {
    if (!lockRef.current) {
      lockRef.current = true;
      if (data.conf) {
        const { on_1, off_1, on_2, off_2, program_on, target, advance } =
          data.conf;
        setConfig({
          on_1,
          off_1,
          on_2,
          off_2,
          program_on,
          target,
        });
        setOverride(advance ?? { on: false });
      }
      if (data.indoor_temperature) setCurrentTemp(data.indoor_temperature);
      if (data.relay_on !== null) setRelayOn(data.relay_on);
      lockRef.current = false;
    }
  }, []);

  const getSettings = React.useCallback(async () => {
    console.debug("Getting settings");
    await fetch("/heating/")
      .then((res) =>
        res.json().then((data: Data) => {
          if (res.status !== 200) return console.log(data);
          parseData(data);
        })
      )
      .finally(() => {
        setIsLoading(false);
        firstLoad.current = false;
      });
  }, [fetch, parseData]);

  const setSettings = React.useCallback(
    async (currentState: HeatingConfig) => {
      console.debug("Updating settings");
      await fetch("/heating/", "POST", currentState).then((res) =>
        res.json().then((data) => {
          if (res.status !== 200) console.error(data);
          else {
            if (data !== currentState) parseData(data);
          }
        })
      );
    },
    [fetch, parseData]
  );

  const debounce = React.useCallback(
    (state: HeatingConfig) => {
      clearTimeout(timeoutRef.current as ReturnType<typeof setTimeout>);
      timeoutRef.current = setTimeout(() => {
        setSettings(state)
          .catch((error) => console.log(error))
          .then(() => (lockRef.current = true));
      }, 600);
    },
    [setSettings]
  );

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

  const withinLimit1: boolean =
    !!config.program_on &&
    checkTimeStringWithinLimit(config.on_1, config.off_1);

  const withinLimit2: boolean =
    !!config.program_on &&
    checkTimeStringWithinLimit(config.on_2 as string, config.off_2 as string);

  const overrideDisabled = () => {
    switch (true) {
      case !config.program_on:
        return false;
      case withinLimit1:
        return true;
      case withinLimit2:
        return true;
      default:
        return false;
    }
  };

  async function programOnOff() {
    console.debug("Switching on/off");
    await fetch("/heating/on_off/").then((res) =>
      res.json().then((data) => {
        if (res.status !== 200) return console.log(data);
        parseData(data);
        lockRef.current = false;
      })
    );
  }

  function handleProgramChange(event: React.ChangeEvent<HTMLInputElement>) {
    lockRef.current = true;
    setConfig({ ...config, program_on: event.target.checked });
    programOnOff().catch((error) => console.log(error));
  }

  React.useEffect(() => {
    getSettings().catch((error) => console.log(error));
    firstLoad.current = false;
  }, [getSettings]);

  React.useEffect(() => {
    if (firstLoad.current) return;
    if (lockRef.current) {
      lockRef.current = false;
      return;
    }
    debounce(config);
    return () => {
      clearTimeout(timeoutRef.current as ReturnType<typeof setTimeout>);
    };
  }, [debounce, config]);

  React.useEffect(() => {
    function getInfo() {
      fetch("/heating/").then((res) =>
        res.json().then((data: Data) => {
          if (res.status !== 200) return console.log(data);
          parseData(data);
        })
      );
    }
    getInfo();
    let interval = setInterval(getInfo, TEMPERATURE_INTERVAL);
    return () => clearInterval(interval);
  }, [fetch, parseData]);

  const click = () => {
    const elem = document.getElementsByClassName("section")[0] as HTMLElement;
    elem.style.transform = "scale(0)";
    elem.style.height = "0";
  };

  return (
    <FullScreenComponent>
      <WeatherButton />
      <HelpButton helpMode={helpMode} setHelpMode={setHelpMode} />
      <form className="heating-settings">
        {isLoading ? (
          <FullScreenLoader />
        ) : (
          <>
            <h1>Heating Settings</h1>
            {currentTemp && (
              <StyledTooltip
                title={`Indoor Temperature. Relay is currently ${
                  relayOn ? "on" : "off"
                }`}
                placement="top"
                disabled={!helpMode}
              >
                <h1
                  className={classNames("TempDisplay", {
                    TempDisplay__On: relayOn,
                  })}
                >
                  {currentTemp.toFixed(1)}&deg;C
                </h1>
              </StyledTooltip>
            )}
            <Stack
              spacing={2}
              direction="row"
              sx={{ mb: 3 }}
              alignItems="center"
              justifyContent="center"
            >
              <h2>Target:</h2>
              <StyledTooltip
                title="Desired internal temperature"
                placement="top"
                disabled={!helpMode}
              >
                <Slider
                  aria-label="Target Temperature"
                  value={config.target}
                  onChange={handleSliderChange}
                  min={10}
                  max={28}
                />
              </StyledTooltip>
              <h2>{config.target}&deg;C</h2>
            </Stack>

            <section style={{ position: "relative" }}>
              <Stack
                spacing={4}
                direction="row"
                sx={{ mb: 5 }}
                alignItems="center"
                justifyContent="center"
                className={"TimeInputRow"}
              >
                <StyledTextField
                  label="On 1"
                  name="on_1"
                  type="time"
                  value={config.on_1}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  required={true}
                  onChange={handleTimeChange}
                  disabled={!config.program_on}
                />
                <span>
                  <ProgramArrow
                    programOn={config.program_on as boolean}
                    withinLimit={withinLimit1}
                  />
                  <ProgramArrow
                    programOn={config.program_on as boolean}
                    withinLimit={withinLimit1}
                  />
                  <ProgramArrow
                    programOn={config.program_on as boolean}
                    withinLimit={withinLimit1}
                  />
                </span>
                <StyledTextField
                  label="Off 1"
                  name="off_1"
                  type="time"
                  value={config.off_1}
                  required={true}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  onChange={handleTimeChange}
                  disabled={!config.program_on}
                />
              </Stack>
              {row2 ? (
                ""
              ) : (
                <OpenCloseButton open={true} closeFunc={() => setRow2(true)} />
              )}
            </section>
            {row2 ? (
              <section className="section" style={{ position: "relative" }}>
                <Stack
                  spacing={4}
                  direction="row"
                  sx={{ mb: 3 }}
                  alignItems="center"
                  justifyContent="center"
                  className={"TimeInputRow"}
                >
                  <StyledTextField
                    label="On 2"
                    name="on_2"
                    type="time"
                    value={config.on_2}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    onChange={handleTimeChange}
                    disabled={!config.program_on}
                  />
                  <span>
                    <ProgramArrow
                      programOn={config.program_on as boolean}
                      withinLimit={withinLimit2}
                    />
                    <ProgramArrow
                      programOn={config.program_on as boolean}
                      withinLimit={withinLimit2}
                    />
                    <ProgramArrow
                      programOn={config.program_on as boolean}
                      withinLimit={withinLimit2}
                    />
                  </span>
                  <StyledTextField
                    label="Off 2"
                    type="time"
                    name="off_2"
                    value={config.off_2}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    onChange={handleTimeChange}
                    disabled={!config.program_on}
                  />
                </Stack>
                <OpenCloseButton
                  open={false}
                  closeFunc={() => {
                    click();
                    setTimeout(() => setRow2(false), 500);
                  }}
                />
              </section>
            ) : (
              ""
            )}
            <StyledTooltip
              title="Frost stat mode when off (5&deg;C)"
              placement="top"
              disabled={!helpMode}
            >
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
                  checked={config.program_on}
                />
                <h2>{config.program_on ? "On" : "Off"}</h2>
              </Stack>
            </StyledTooltip>
            <Stack
              spacing={2}
              direction="column"
              sx={{ mb: 4 }}
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
                <StyledTooltip
                  title={`${override.on ? "Cancel" : "Run"} thermostat control${
                    !override.on ? " for 1 hour" : ""
                  }`}
                  placement="top"
                  disabled={!helpMode}
                >
                  <span>
                    <Button
                      variant={
                        override.on && !overrideDisabled()
                          ? "contained"
                          : "outlined"
                      }
                      disabled={overrideDisabled()}
                      onClick={handleOverride}
                    >
                      {override.on && !overrideDisabled()
                        ? "Cancel Override"
                        : "1hr Override"}
                    </Button>
                  </span>
                </StyledTooltip>
              </Stack>
              {override.start && !overrideDisabled() ? (
                <p className="text-muted">
                  on until{" "}
                  {new Date(
                    (override.start + 3600) * 1000
                  ).toLocaleTimeString()}
                </p>
              ) : (
                <p style={{ opacity: 0 }}>Override Off</p>
              )}
            </Stack>
          </>
        )}
      </form>
    </FullScreenComponent>
  );
}
