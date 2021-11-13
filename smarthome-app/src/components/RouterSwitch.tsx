import * as React from "react";
import { Route, Switch } from "react-router-dom";
import { MainMenu } from "./MainMenu/MainMenu";
import { HeatingContainer } from "./Heating/HeatingContainer";
import {SettingsForm} from "./Heating/SettingsForm";

export default function RouterSwitch() {
  return (
    <Switch>
      <Route exact path="/" component={MainMenu} />
      <Route exact path="/heating" component={HeatingContainer} />
      <Route
        exact
        path="/heating/settings"
        component={SettingsForm}
      />
    </Switch>
  );
}
