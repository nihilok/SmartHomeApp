import React, {useEffect, useState} from 'react';
import {AuthContext} from "../contexts/AuthContext";
import {useToastContext, ADD} from "../contexts/ToastContext";
// import FetchAuthService from '../service/FetchService';


const HeatingBlock = ({props}) => {
  const initialState = {
    indoor_temp: '',
    outdoor_temp: '',
    on: false,
    program_on: false
  }
  const [info, setInfo] = useState(initialState)
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true)
  const [colour, setColour] = useState('var(--primary-light)')
  const {authState} = React.useContext(AuthContext);
  const {toastDispatch} = useToastContext()
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authState.token}`
  }


  async function GetInfo() {
    setLoading(true);
    await fetch(`${authState.apiBaseUrl}/heating/info/`).then(response =>
        response.json().then((data) => {
          if (error) {
            setError(null)
          }
          setInfo(data);
        })).catch(e => setError(e)).then(() => setLoading(false));
  }

  // async function GetInfo() {
  //   await fetch(`${authState.apiBaseUrl}/heating/info/`).then(response =>
  //       response.json().then((data) => {
  //         data.on ? setColour('red') : setColour('var(--primary-light)');
  //         setInfo(data);
  //       })).catch((e) => setError(e));
  // }

  async function UpdateInfo() {
    await fetch(`${authState.apiBaseUrl}/heating/info/temperature/`).then(response =>
        response.json().then((data) => {
          data.on ? setColour('red') : setColour('var(--primary-light)');
          console.log(data)
          setInfo(prevData => ({
            ...prevData,
            indoor_temp: data.indoor_temp,
            on: data.on,
            program_on: data.program_on
          }));
        })).catch((e) => setError(e));
  }

  const handleSwitch = async (e) => {
    setInfo((prevInfo) => ({
      ...prevInfo,
      program_on: !info.program_on
    }))
    await fetch(`${authState.apiBaseUrl}/heating/on_off/`,
        {headers}
    )
        .then(response =>
            response.json().then((data) => {
              console.log(data)
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
                  setInfo((info) => ({
                    ...info,
                    program_on: data.program_on
                  }));
                }
              }
            }));
  }

  useEffect(() => {
    GetInfo().catch(e=>setError(e));
    const interval = setInterval(() => {
      UpdateInfo().catch(e=>setError(e));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return loading ? <div className="Heating-display">
        <div className="lds-ripple mt-10">
          <div/>
          <div/>
        </div>
      </div> :
      <div className="Heating-display">
        {error ? <p>Can't update heating info: ${error.message}</p> : ''}
        <div className="Indoor-temp" style={{color: colour}}>{info.indoor_temp}</div>
        <div className="Other-info">Outdoor: <span
            className="value">{info.outdoor_temp}</span></div>
        <div className="Other-info">Weather: <span
            className="value">{info.weather}</span></div>
        <div className="flex-row-center"><label className="switch">
          <input type="checkbox" name="on_off" onChange={handleSwitch} checked={info.program_on}/>
          <span className="slider round"/>
        </label></div>
      </div>;
}


export default HeatingBlock;