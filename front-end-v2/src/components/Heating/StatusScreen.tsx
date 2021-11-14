import * as React from "react";
import { Link } from "react-router-dom";
import { useFetchWithToken } from "../../hooks/FetchWithToken";
import { SimpleEllipsisLoader } from "../SimpleEllipsisLoader";
import {Button} from "@mui/material";

interface HeatingResponse {
  indoor_temp: string;
  outdoor_temp: string;
  weather: string;
  last_updated: string;
  on: boolean;
  program_on: boolean;
}

export function StatusScreen() {
  const [loading, setLoading] = React.useState(true);

  const [data, setData] = React.useState({
    indoor: "",
    outdoor: "",
    weather: "",
  });

  const fetch = useFetchWithToken();

  const getInfo = React.useCallback(async () => {
    fetch("/heating/info/").then((res) =>
      res.json().then((data: HeatingResponse) => {
        if (res.status === 200) {
          console.log(data);
          setTimeout(() => setLoading(false), 400);
          setData((p) => ({
            ...p,
            indoor: data.indoor_temp,
            outdoor: data.outdoor_temp,
            weather: data.weather,
          }));
        } else console.error(res);
      })
    );
  }, [fetch]);

  React.useEffect(() => {
    getInfo().catch((err) => console.log(err));
  }, []);

  return (
    <div className="status-screen">
      <h1>Current Status</h1>
      <p>
        Indoor:{" "}
        <span>
          {loading ? <SimpleEllipsisLoader loading={loading} /> : data.indoor}
        </span>
      </p>
      <p>
        Outdoor:{" "}
        <span>
          {loading ? <SimpleEllipsisLoader loading={loading} /> : data.outdoor}
        </span>
      </p>
      <p>
        Weather:{" "}
        <span>
          {loading ? <SimpleEllipsisLoader loading={loading} /> : data.weather}
        </span>
      </p>
      <Link to="/settings"><Button variant={'contained'} color={'primary'}>Settings</Button></Link>
    </div>
  );
}
