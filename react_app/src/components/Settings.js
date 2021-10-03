import React, {useContext, useState} from 'react';
import {AuthContext} from "../contexts/AuthContext"
import {useHistory} from "react-router-dom";
import {Header} from "./Header";
import NoteModal from "./NoteModal/NoteModal";
import {useInput} from "../hooks/input-hook";

const Settings = ({setDarkMode}) => {

  const {authState, authDispatch} = useContext(AuthContext);
  const [settingRoute, setSettingRoute] = useState(false)
  const {value: route, bind: bindRoute} = useInput('');

  let history = useHistory();

  const handleDarkMode = () => {
    setDarkMode(!authState.darkMode)
    // console.log(authState.darkMode)
    authDispatch({
      type: "DARKMODE",
    });
  }


  const logOut = (e) => {
    e.preventDefault();
    authDispatch({
      type: "LOGOUT",
    });
    history.push('/');
  }

  async function handleSubmit() {
    localStorage.setItem('route', JSON.stringify(route))
  }

  return (
      <div>
        <Header text={"Settings"} back={'/'}/>
        <div className="flex-col-center settings">
          <input type="submit" className="btn" onClick={handleDarkMode}
                 value={authState.darkMode ? "Light Mode" : "Dark Mode"}/>
          <input type="submit" className="btn" onClick={() => setSettingRoute(true)} value="Setup Route"/>
          <input type="submit" className="btn" onClick={() => window.location.reload()} value="Restart App"/>
          <input type="submit" className="btn" onClick={logOut} value="Log Out"/></div>
        {settingRoute ? <NoteModal
            title="Set Route"
            renderContent={() => {
              return (
                  <div className="Recipe-card-content">
                    <form className="New-recipe flex-col-center" onSubmit={handleSubmit}>
                      <div className="form-control"><input type="text" placeholder="URL to route" {...bindRoute}
                                                           required/>
                      </div>
                      <input type="submit" value="Save" className="btn btn-outline"/>
                    </form>
                  </div>
              )
            }
            }
            setHidden={() => setSettingRoute(!settingRoute)}/> : ''}
      </div>
  );
};

export default Settings;