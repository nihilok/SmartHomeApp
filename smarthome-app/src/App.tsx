import * as React from 'react';
import {Redirect} from "react-router-dom";
import {useAuthContext} from "./context/AuthContext";
import {RouterSwitch} from "./components/RouterSwitch";

function App() {

    const {context} = useAuthContext();

    return (
        <>
            <RouterSwitch/>
            {!context.isAuthenticated && <Redirect to='/login'/>}
        </>
    );
}

export default App;
