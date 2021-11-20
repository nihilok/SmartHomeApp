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
import { useSnackbar } from "notistack";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import { Barometer } from "../Barometer/Barometer";
import { TopBar } from "../Custom/TopBar";

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
    indoor_temperature?: number;
    sensor_readings?: Sensors;
    relay_on?: boolean;
    advance?: Override;
    conf?: HeatingConfig;
  }

  const initialState: HeatingConfig = {
    target: 20,
    program_on: true,
    on_1: "",
    off_1: "",
    on_2: "",
    off_2: "",
  };

  const fetch = useFetchWithToken();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();
  const row2TimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();
  const lockRef = React.useRef(true);
  const firstLoad = React.useRef(true);
  const [config, setConfig] = React.useState(initialState);
  const [readings, setReadings] = React.useState({
    temperature: 0,
    pressure: 0,
    humidity: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [showSettings, setShowSettings] = React.useState(
    JSON.parse(localStorage.getItem("showSettings") as string) ?? true
  );
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

  const parseData = React.useCallback((data: APIResponse) => {
    if (data.conf) {
      const { on_1, off_1, on_2, off_2, program_on, target } = data.conf;
      setConfig({
        on_1,
        off_1,
        on_2,
        off_2,
        program_on,
        target,
      });
    }
    setOverride(data.advance ?? { on: false });
    if (data.sensor_readings !== undefined && data.sensor_readings !== null) {
      setReadings(
        data.sensor_readings ?? { temperature: 0, pressure: 0, humidity: 0 }
      );
    }
    if (
      data.indoor_temperature !== undefined &&
      data.indoor_temperature !== null
    ) {
      setCurrentTemp(data.indoor_temperature);
    }
    if (data.relay_on === false || data.relay_on === true) {
      setRelayOn(data.relay_on);
    }
  }, []);

  const getSettings = React.useCallback(async () => {
    console.debug("Getting settings");
    await fetch("/heating/?conf=true")
      .then((res) =>
        res.json().then((data: APIResponse) => {
          if (res.status !== 200) return console.log(data);
          lockRef.current = true;
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
            if (data !== currentState) {
              lockRef.current = true;
              parseData(data);
            }
          }
        })
      );
    },
    [fetch, parseData]
  );

  const debounce = React.useCallback(
    (state: HeatingConfig) => {
      clearTimeout(timeoutRef.current as ReturnType<typeof setTimeout>);
      if ((!config.on_2 && config.off_2) || (config.on_2 && !config.off_2))
        return;
      timeoutRef.current = setTimeout(() => {
        setSettings(state)
          .catch((error) => console.log(error))
          .then(() => (lockRef.current = true));
      }, 600);
    },
    [setSettings, config.on_2, config.off_2]
  );

  async function handleOverride() {
    if (override.on) {
      return await fetch("/heating/cancel/").then((res) =>
        res.json().then((data) => {
          setOverride({ on: data.on });
          setRelayOn(data.relay);
        })
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
        setRelayOn(data.relay);
      })
    );
  }

  const withinLimit1: boolean =
    !!config.program_on &&
    checkTimeStringWithinLimit(config.on_1, config.off_1);

  const withinLimit2: boolean = config.on_2
    ? !!config.program_on &&
      checkTimeStringWithinLimit(config.on_2 as string, config.off_2 as string)
    : false;

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
        lockRef.current = true;
        parseData(data);
      })
    );
  }

  function handleProgramChange(event: React.ChangeEvent<HTMLInputElement>) {
    lockRef.current = true;
    setConfig({ ...config, program_on: event.target.checked });
    programOnOff().catch((error) => console.log(error));
  }

  function toggleSettings() {
      localStorage.setItem("showSettings", JSON.stringify(!showSettings))
      setShowSettings(!showSettings)
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
        res.json().then((data: APIResponse) => {
          if (res.status !== 200) {
            console.log(data);
            return;
          }
          parseData(data);
        })
      );
    }

    let interval = setInterval(getInfo, TEMPERATURE_INTERVAL);
    return () => clearInterval(interval);
  }, [fetch, parseData]);

  const setRow2Null = () => {
    row2TimeoutRef.current = setTimeout(() => {
      lockRef.current = false;
      setConfig((p) => ({
        ...p,
        on_2: undefined,
        off_2: undefined,
      }));
    }, 4000);
  };

  const handleHideRow = () => {
    enqueueSnackbar("Period 2 removed", {
      action: <Button onClick={undoHideRow}>Undo</Button>,
    });
    setRow2(false);
    setRow2Null();
  };

  const undoHideRow = () => {
    clearTimeout(row2TimeoutRef.current as ReturnType<typeof setTimeout>);
    setRow2(true);
    closeSnackbar();
  };

  return (
    <FullScreenComponent>
      <TopBar>
        <WeatherButton />
        <HelpButton helpMode={helpMode} setHelpMode={setHelpMode} />
      </TopBar>
      <form className="heating-settings">
        {isLoading ? (
          <FullScreenLoader />
        ) : (
          <div className="flex flex-col space-evenly">
            <h1 className="title">Open Heating</h1>
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
            <Barometer readings={readings} />
            {showSettings && (
              <>
                <Stack
                  spacing={2}
                  direction="row"
                  sx={{ mb: 1 }}
                  alignItems="center"
                  justifyContent="center"
                >
                  <h2>Target:</h2>
                  <StyledTooltip
                    title="Desired internal temperature"
                    placement="bottom"
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
                <section className={"time-grid"}>
                  <div />
                  <StyledTextField
                    label={`On${row2 ? " 1" : ""}`}
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
                    label={`Off${row2 ? " 1" : ""}`}
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
                  {row2 ? (
                    <div />
                  ) : (
                    config.program_on && (
                      <OpenCloseButton
                        open={true}
                        callback={() => {
                          clearTimeout(
                            row2TimeoutRef.current as ReturnType<
                              typeof setTimeout
                            >
                          );
                          setRow2(true);
                        }}
                      />
                    )
                  )}
                </section>
                {row2 ? (
                  <section className={"time-grid"} id={"row-2"}>
                    <div />
                    <StyledTextField
                      label="On 2"
                      name="on_2"
                      type="time"
                      value={config.on_2 || ""}
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
                      value={config.off_2 || ""}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      onChange={handleTimeChange}
                      disabled={!config.program_on}
                    />
                    {config.program_on && (
                      <OpenCloseButton open={false} callback={handleHideRow} />
                    )}{" "}
                  </section>
                ) : (
                  <div />
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
                    <h2>
                      {config.program_on ? (
                        "On"
                      ) : (
                        <div className="flex">
                          {"Off "}
                          <AcUnitIcon
                            style={{ marginTop: "2px", display: "block" }}
                          />
                        </div>
                      )}
                    </h2>
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
                      title={`${
                        override.on ? "Cancel" : "Run"
                      } thermostat control${!override.on ? " for 1 hour" : ""}`}
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
              <Button sx={{width: 'max-content', mx: 'auto', fontSize: '.75rem', py: 0, pt: .5}} onClick={toggleSettings}>{showSettings ? 'Hide' : 'Show'} Settings</Button>
          </div>
        )}
      </form>
    </FullScreenComponent>
  );
}
