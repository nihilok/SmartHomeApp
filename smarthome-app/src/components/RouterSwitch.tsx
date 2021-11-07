import * as React from 'react';
import {Route, Switch} from "react-router-dom";
import {MainMenu} from "./MainMenu";
import {LoginForm} from "./Login/LoginForm";
import {HeatingContainer} from "./Heating/HeatingContainer";

export function RouterSwitch() {
    return (
        <Switch>
            <Route exact path="/" component={MainMenu}/>
            <Route exact path="/login" component={LoginForm}/>
            <Route exact path="/heating" component={HeatingContainer}/>
            <Route exact path="/heating/settings" component={() => <h1>settings</h1>}/>
        </Switch>
    );
}