import * as React from 'react';
import {Link} from "react-router-dom";

export function HeatingContainer() {

    async function getInfo() {
    }

    return (
        <div>
            <h1>Heating</h1>
            <p>Current indoor temperature: <span id={'indoor'}/>&deg;C</p>
            <Link to="/heating/settings">Settings</Link>
        </div>
    );
}