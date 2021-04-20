import React from 'react';
import {Header} from './Header';

function Cams(props) {
    return (
        <>
        <Header text='Cams' back={true}/>
        <div className={"flex flex-col justify-center items-center h-full"}>
            <img src={"https://api.smarthome.mjfullstack.com/cam"} className={"rounded-3xl"} alt={"cam_feed"}/>
        </div>
        </>
    );
}

export default Cams;