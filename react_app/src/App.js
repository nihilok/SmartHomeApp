import React, {useEffect, useReducer, useState} from "react";
import {Route, Redirect} from "react-router-dom";
import {
  AuthContext,
  initialState as initialAuthState,
  reducer as authReducer
} from "./contexts/AuthContext";
import MenuScreen from "./components/Menu";
import Login from "./components/Login";
import Heating from "./components/Heating";
import HeatingSettings from "./components/HeatingSettings";
import Tasks from "./components/Tasks";
import Shopping from "./components/Shopping";
import Cams from "./components/Cams";
import Recipes from "./components/Recipes";
import Settings from "./components/Settings";
import Loader from "./components/Loader";
import {apiBaseUrl} from "./service/FetchService";


function App() {

  const [authState, authDispatch] = useReducer(authReducer, initialAuthState)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (token) {
      fetch(`${apiBaseUrl}/check_token/`,
          {method: 'POST', body: JSON.stringify({access_token: token, token_type: 'Bearer'})})
          .then(response => response.json()
              .then(data => {
                if (response.status !== 200) {
                  authDispatch({type: "LOGOUT"})
                  setIsLoading(false)
                } else {
                  authDispatch({
                    type: "LOGIN",
                    payload: data
                  });
                }

              })).catch((e) => {
                authDispatch({type: "LOGOUT"});
              }).finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  return (
      <AuthContext.Provider
          value={{
            authState,
            authDispatch
          }}>

        <div className="App">
          {isLoading ? <Loader/> :
              !authState.isAuthenticated ? <Login/> :
                  <>
                    <Route exact path="/" component={MenuScreen}/>
                    <Route path="/settings" component={HeatingSettings}/>
                    <Route path="/config" component={Settings}/>
                    <Route path="/heating" component={Heating}/>
                    <Route path="/tasks" component={Tasks}/>
                    <Route path="/shopping" component={Shopping}/>
                    <Route path="/cam" component={Cams}/>
                    <Route path="/recipes" component={Recipes}/>
                  </>}

          <Route path="/map" component={() => {
            window.location.href = 'https://goo.gl/maps/SZnfFiGk2VhpDoWV9';
            return <Redirect to="/" />;
          }}/>
        </div>
      </AuthContext.Provider>
  );
}

export default App;
