import React, {useEffect, useState} from 'react';

export const HeatingSettings = ({setFormHidden}) => {
    const [settings, setSettings] = useState({
        'target': 20,
        'program': {}
    })
    const [target, setTarget] = useState(20)
    const [timeOn1, setTimeOn1] = useState('')
    const [timeOff1, setTimeOff1] = useState('')
    const [timeOn2, setTimeOn2] = useState('')
    const [timeOff2, setTimeOff2] = useState('')
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true)


    async function GetSettings() {
        try {
            setLoading(true);
            const resp = await fetch(`https://server.smarthome.mjfullstack.com/heating/conf`, {
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'GET'
            })
                .then(response =>
                    response.json().then((data) => {
                        return data
                    }));
            setSettings(resp);
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    }

    async function PostSettings(form) {
        await fetch(`https://server.smarthome.mjfullstack.com/heating/`, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({form})
        })
            .then(() => {
                GetSettings();
            });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        let formData = {
            program: {
                on_1: timeOn1,
                off_1: timeOff1,
                on_2: timeOn2,
                off_2: timeOff2
            },
            target: target,
            program_on: true
        };
        PostSettings(formData);
        setFormHidden(true);
    }


    const handleTargetChange = (e) => {
        setTarget(e.target.value);
    }

    const handleTimeChange = (e) => {
        switch (e.target.name) {
            case 'on_1':
                setTimeOn1(e.target.value);
                break;
            case 'on_2':
                setTimeOn2(e.target.value);
                break;
            case 'off_1':
                setTimeOff1(e.target.value);
                break;
            case 'off_2':
                setTimeOff2(e.target.value);
                break;
            default:
                break;
        }
    }


    useEffect(() => {
        GetSettings();
        setTarget(settings.target);
        setTimeOn1(settings.program.on_1);
        setTimeOff1(settings.program.off_1);
        setTimeOn2(settings.program.on_2);
        setTimeOff2(settings.program.off_2);
    }, [settings.target, settings.program.on_1, settings.program.off_1, settings.program.on_2, settings.program.off_2])

    if (error) {
        return <div className="bg-red-500 text-black">{error.message}</div>
    }
    return (loading ? <div className="centerCol w-full">
                    <div className="lds-ellipsis">
                        <div/>
                        <div/>
                        <div/>
                        <div/>
                    </div>
                </div> : <div className="centerCol text-white">
        <ul>
            <li>Target: {target}°C</li>
        </ul>
        <form className="centerCol space-y-2 mt-5" onSubmit={handleSubmit}>
            <input name="target" type="range" min="6" max="26" onChange={handleTargetChange} value={target}
                   className="mb-5"/>
            <div className={"grid grid-cols-2"}>
                <label>ON 1 </label><input name="on_1" type="time" className="timeInput text-black"
                                           value={timeOn1} onChange={handleTimeChange}/>
                <label>OFF 1 </label><input name="off_1" type="time" className="timeInput text-black"
                                            value={timeOff1} onChange={handleTimeChange}/>
                <label>ON 2 </label><input name="on_2" type="time" className="timeInput text-black"
                                           value={timeOn2} onChange={handleTimeChange}/>
                <label>OFF 2 </label><input name="off_2" type="time" className="timeInput text-black"
                                            value={timeOff2} onChange={handleTimeChange}/>
            </div>
            <div className="pt-5">
                <button type="submit" className="submitBtn">SAVE</button>
            </div>
        </form>
    </div>)
}

export const HeatingBlock = ({props}) => {
    const [info, setInfo] = useState(null)
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true)
    const [colour, setColour] = useState('white')

    async function GetInfo() {
        try {
            setLoading(true);
            const resp = await fetch(`https://server.smarthome.mjfullstack.com/heating/info`).then(response =>
                response.json().then((data) => {
                    console.log(data);
                    return data
                }));
            setInfo(resp);
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    }

    async function UpdateInfo() {
        try {
            const resp = await fetch(`https://server.smarthome.mjfullstack.com/heating/info`).then(response =>
                response.json().then((data) => {
                    data.on ? setColour('red') : setColour('white');
                    return data
                }));
            setInfo(resp);
        } catch (e) {
            setError(e);
        }
    }

    useEffect(() => {
        GetInfo();
        const interval = setInterval(() => {
            UpdateInfo();
        }, 3000);
        return () => clearInterval(interval);
    }, []);
    if (error) return "Failed to load heating info";
    return loading ? <div className="lds-ripple mt-10">
            <div/>
            <div/>
        </div> :
        <div className="flex flex-col justify-start items-center h-full w-full px-2 space-y-2 pt-5">
            <div className="text-white text-6xl font-semibold py-5" style={{color: colour}}>{info.indoor_temp}</div>
            <div className="text-white"><span className="font-semibold text-gray-200">Outdoor:</span> <span
                className="font-bold">{info.outdoor_temp}</span></div>
            <div className="text-white"><span className="font-semibold text-gray-200">Weather:</span> <span
                className="font-bold">{info.weather}</span></div>
        </div>;
}
