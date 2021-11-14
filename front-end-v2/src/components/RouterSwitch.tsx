import * as React from "react";
import { Route, Switch } from "react-router-dom";
// import { StatusScreen } from "./Heating/StatusScreen";
import {SettingsForm} from "./Heating/SettingsForm";

export default function RouterSwitch() {
  return (
    <Switch>
      {/*<Route exact path="/" component={StatusScreen} />*/}
      <Route
        exact
        path="/"
        component={SettingsForm}
      />
    </Switch>
  );
}
