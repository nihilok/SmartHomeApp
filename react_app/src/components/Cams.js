import React from 'react';
import {Header} from './Header';
import {useAuthContext} from "../contexts/AuthContext";

function Cams(props) {

    const {authState} = useAuthContext();

    return (
        <>
        <Header text='Cams' back={'/'}/>
        <div className={"flex-col-center container"}>
            <div className="cam-screen"><div className="cam-title"><h3>Driveway:</h3></div><img src={authState.camUrl} className={"cam-feed"} alt={"cam_feed"}/></div>
        </div>
        </>
    );
}

export default Cams;