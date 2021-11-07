import React, {useEffect, useState} from 'react';
import {AuthContext} from "../contexts/AuthContext";
import {useToastContext, ADD} from "../contexts/ToastContext";
import {RippleLoader} from "./Loader";
import {useFetchWithToken} from "../hooks/FetchWithToken";
import FetchWithToken from "../service/FetchService";


const HeatingBlock = ({props}) => {
  const initialState = {
    indoor_temp: '',
    outdoor_temp: '',
    last_updated: '--:--:--',
    on: false,
    program_on: localStorage.getItem('heating_program_on') || true
  }
  const {authState} = React.useContext(AuthContext);
  const {toastDispatch} = useToastContext()
  const [info, setInfo] = useState(initialState)
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true)
  const [colour, setColour] = useState('var(--primary-light)')
  const getFromServer = useFetchWithToken();

  async function GetInfo() {
    const temp = JSON.parse(localStorage.getItem('temp'))
    if (temp) {
      setInfo(temp);
    } else {
      setLoading(true);
    }
    await getFromServer(`${authState.apiBaseUrl}/heating/info/`).then(response =>
        response.json().then((data) => {
          if (error) {
            setError(null)
          }
          setInfo(data);
        })).catch(e => setError(e)).finally(() => {
      setLoading(false);
      UpdateInfo().catch(e => setError(e));
    });
  }

  async function UpdateInfo() {
    await fetch(`${authState.apiBaseUrl}/heating/info/temperature/`).then(response =>
        response.json().then((data) => {
          setError(null)
          data.on ? setColour('firebrick') : setColour('var(--primary-light)');
          setInfo(prevData => ({
            ...prevData,
            indoor_temp: data.indoor_temp,
            on: data.on,
            program_on: data.program_on
          }));
          localStorage.setItem('temp', JSON.stringify(data))
        })).catch((e) => setError(e));
  }

  const handleSwitch = async (e) => {
    setInfo((prevInfo) => ({
      ...prevInfo,
      program_on: !info.program_on
    }))
    await getFromServer(`${authState.apiBaseUrl}/heating/on_off/`)
        .then(response =>
            response.json().then((data) => {
              if (response.status !== 200) {
                toastDispatch({
                  type: ADD,
                  payload: {
                    content: 'You are not authorised to do that!',
                    type: 'danger'
                  }
                });
              } else {
                if (info.program_on !== data.program_on) {
                  localStorage.setItem('heating_program_on', data.program_on);
                  setInfo((info) => ({
                    ...info,
                    program_on: data.program_on
                  }));
                }
              }
            }));
  }

  const [advanceOn, setAdvanceOn] = useState(null)

  const handleAdvance = (mins) => {
    FetchWithToken(`/heating/advance/${mins}/`, 'GET', authState, setAdvanceOn)
        .catch(err => console.log(err))
  }

  const handleCancel = () => {
    FetchWithToken(`/heating/cancel/`, 'GET', authState, setAdvanceOn)
        .catch(err => console.log(err))
  }

  useEffect(() => {
    GetInfo().catch(e => setError(e));
    const interval = setInterval(() => {
      UpdateInfo().catch(e => setError(e));
    }, 5000);
    return () => {
      clearInterval(interval)
    };
  }, []);

  return (
      <div className="Heating-display">
        {error ? <p>Can't update heating info: ${error.message}</p> : ''}
        <div className="Display-screen Heating-screen">
          {loading ? <div><RippleLoader classname={"Loader-block"}/></div> :
              <div className="Display-screen-inner">
                <div className="Indoor-temp" style={{color: colour}}>{info.indoor_temp}</div>
                <div className="Other-info"><span
                    className="value">{info.outdoor_temp} outdoors</span></div>
                <div className="Other-info"><span
                    className="value">{info.weather}</span></div>
                <div className="Other-info"><span
                    className="value small">updated: {info.last_updated}</span></div>
              </div>}
        </div>
        <div className="flex-row-center">
          <label className="switch">
            <input type="checkbox" name="on_off" onChange={handleSwitch} checked={info.program_on}/>
            <span className="slider round"/>
          </label>
        </div>
        <div className="flex-row-center">
          {!advanceOn?.started ? <button className={'btn'} onClick={() => handleAdvance(30)}>Advance (30mins)</button> :
              <button className={'btn'} onClick={() => handleCancel()}>Cancel</button>}
        </div>
      </div>
  );
}


export default HeatingBlock;