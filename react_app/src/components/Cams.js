import React from 'react';
import {Header} from './Header';

function Cams(props) {
    return (
        <>
        <Header text='Cams' back={'/'}/>
        <div className={"flex-col-center container"}>
            <div className="cam-title"><h3>Driveway:</h3></div>
            <img src={"https://api.smarthome.mjfullstack.com/cam"} className={"cam-feed"} alt={"cam_feed"}/>
        </div>
        </>
    );
}

export default Cams;