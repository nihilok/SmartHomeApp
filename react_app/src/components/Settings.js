import React, {useContext} from 'react';
import {AuthContext} from "../contexts/AuthContext"
import {useHistory} from "react-router-dom";
import {Header} from "./Header";

const Settings = () => {

  const {authDispatch} = useContext(AuthContext);
  let history = useHistory();

  const setDarkMode = () => {
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

  return (
      <div>
        <Header text={"Settings"} back={'/'}/>
        <div className="flex-col-center settings">
          <input type="submit" className="btn" onClick={setDarkMode} value="Dark Mode"/>
          <input type="submit" className="btn" onClick={logOut} value="Log Out"/></div>
      </div>
  );
};

export default Settings;