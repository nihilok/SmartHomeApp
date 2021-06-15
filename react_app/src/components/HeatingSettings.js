import React, {useEffect, useState} from 'react';
import {AuthContext} from "../contexts/AuthContext";
import {Header} from "./Header";
import {useToastContext, ADD} from "../contexts/ToastContext";
import Loader from "./Loader";


const HeatingSettings = () => {

    const initialState =
        {
            target: 20,
            on_1: '',
            off_1: '',
            on_2: '',
            off_2: '',
            program_on: true
        }
    const [settings, setSettings] = useState(initialState)
    const [change, setChange] = useState(false)
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true)
    const {authState} = React.useContext(AuthContext);
    const {toastDispatch} = useToastContext()
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token}`
    }

    const getSettings = async (isSubscribed) => {
        setLoading(true);
        return await fetch(`${authState.apiBaseUrl}/heating/conf/`, {
            headers,
            method: 'GET'
        })

            .then(res => {
                if (res.status >= 400) {
                    throw new Error("Bad response from server")
                }
                res.json()
                    .then(data => {
                        if (isSubscribed) {
                        setLoading(false)
                        setSettings(data)
                        return data
                        }
                    })
            })


    }

    useEffect(() => {
        let isSubscribed = true;
        getSettings(isSubscribed);
        return () => isSubscribed = false;
    }, [])

    async function PostSettings() {

        if (!change) {

            toastDispatch({
                type: ADD,
                payload: {
                    content: 'No change.',
                    type: 'info'
                }
            });
            return
        }

        await fetch(`${authState.apiBaseUrl}/heating/`, {
            headers,
            method: 'POST',
            body: JSON.stringify({...settings})
        })
            .then((response) => response.json().then((data) => {
                if (response.status !== 200) {
                    toastDispatch({
                        type: ADD,
                        payload: {
                            content: 'You are not authorised to do that!',
                            type: 'danger'
                        }
                    });
                } else {
                    setSettings(data);
                    toastDispatch({
                        type: ADD,
                        payload: {
                            content: 'Heating Settings Updated',
                            type: 'success'
                        }
                    });
                }
            })).catch(e => {
                setError(e);
                toastDispatch({
                    type: ADD,
                    payload: {
                        content: `Error while updating: ${e.message}`,
                        type: 'danger'
                    }
                });
            }).then(() => setChange(false));
    }


    const handleSubmit = (e) => {
        e.preventDefault();
        PostSettings(settings);
        // setFormHidden(true);
    }

    const handleTargetChange = (e) => {
        setChange(true);
        setSettings(settings => ({
            ...settings,
            target: e.target.value
        }));
    }

    const handleTimeChange = (e) => {
        setChange(true);
        switch (e.target.name) {
            case 'on_1':
                setSettings(() => ({
                    ...settings,
                    on_1: e.target.value
                }))
                break;
            case 'on_2':
                setSettings(() => ({
                    ...settings,
                    on_2: e.target.value
                }))
                break;
            case 'off_1':
                setSettings(() => ({
                    ...settings,
                    off_1: e.target.value
                }))
                break;
            case 'off_2':
                setSettings(() => ({
                    ...settings,
                    off_2: e.target.value
                }))
                break;
            default:
                break;
        }
    }

    return (
        <>
            <Header text={'Heating Settings'} back={'/heating'}/>
            {loading ? <Loader classname="Loader Loader-trans"/> :
                error ? "Something went wrong" :
                    <>

                        <div className="Heating-settings">
                            <h2>Target: {settings.target}°C</h2>

                            <form className="Heating-form" onSubmit={handleSubmit}>
                                <div><input name="target" type="range" min="6" max="26" onChange={handleTargetChange}
                                            value={settings.target}
                                            className="mb-5"/></div>
                                <div className={"grid-2"}>
                                    <label>ON 1 </label><input name="on_1" type="time" className="timeInput text-black"
                                                               value={settings.on_1} onChange={handleTimeChange}/>
                                    <label>OFF 1 </label><input name="off_1" type="time"
                                                                className="timeInput text-black"
                                                                value={settings.off_1} onChange={handleTimeChange}/>
                                    <label>ON 2 </label><input name="on_2" type="time" className="timeInput text-black"
                                                               value={settings.on_2} onChange={handleTimeChange}/>
                                    <label>OFF 2 </label><input name="off_2" type="time"
                                                                className="timeInput text-black"
                                                                value={settings.off_2} onChange={handleTimeChange}/>
                                </div>
                                <div><input type="submit" className="btn" value="SAVE"/></div>
                            </form>
                        </div>
                    </>}</>)
}

export default HeatingSettings;