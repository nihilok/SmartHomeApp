import React, {useEffect, useRef, useState} from 'react';
import {Header} from './Header';
import {useAuthContext} from "../contexts/AuthContext";

function Cams(props) {

    const {authState} = useAuthContext();

    const clock = useRef(null);

    const [time, setTime] = useState(new Date().toLocaleString().substring(12))

    useEffect(()=>{
        let timeout = setInterval(()=>{
            setTime(new Date().toLocaleString().substring(12))
        }, 1000)
        return () => clearInterval(timeout)
    },[])

    return (
        <>
        <Header text='Cams' back={'/'}/>
        <div className={"flex-col-center container"}>
            <div className="cam-screen"><div className="cam-title"><h3>Car <span ref={clock}>{time}</span></h3></div><img src={authState.camUrl} className={"cam-feed"} alt={"cam_feed"}/></div>
        </div>
        </>
    );
}

export default Cams;