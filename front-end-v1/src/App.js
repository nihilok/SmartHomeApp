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
import TaskView from "./components/Tasks/TaskView";
import Cams from "./components/Cams";
import Recipes from "./components/Recipes";
import Settings from "./components/Settings";
import Loader from "./components/Loader";
import PlannerScreen from "./components/Planner/PlannerScreen";
import {Header} from "./components/Header";
import ShoppingView from "./components/ShoppingList/ShoppingView";
import BabyTrackerView from "./components/BabyTracker/BabyTrackerView";
import {autoLogout} from "./service/FetchService";
import {useToastContext} from "./contexts/ToastContext";


function App() {

  const [authState, authDispatch] = useReducer(authReducer, initialAuthState)
  const [isLoading, setIsLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(authState.darkMode)
  const {toastDispatch} = useToastContext();

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem('token'))

    if (token) {
      fetch(`${authState.apiBaseUrl}/check_token/`,
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
        autoLogout(authDispatch, toastDispatch);
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

        <div className={darkMode ? 'App dark-mode' : 'App'}>
          {isLoading ? <Loader/> :
              !authState.isAuthenticated ? <Login/> :
                  <>
                    <Route exact path="/" component={MenuScreen}/>
                    <Route path="/settings" component={HeatingSettings}/>
                    <Route path="/config" component={() => (<Settings setDarkMode={setDarkMode}/>)}/>
                    <Route path="/heating" component={Heating}/>
                    <Route path="/tasks" component={TaskView}/>
                    <Route path="/shopping" component={ShoppingView}/>
                    <Route path="/cam" component={Cams}/>
                    <Route path="/recipes" component={Recipes}/>
                    <Route path="/planner" component={PlannerScreen}/>
                    <Route path="/baby" component={BabyTrackerView}/>
                  </>}

          <Route path="/map" component={() => {
            const route = JSON.parse(localStorage.getItem('route'))
            if (route) {
              window.location.href = route
              return <Redirect to="/"/>;
            } else {
              return (
                  <>
                    <Header text="Route" settings="/config" back="/"/>
                    <h1>No route set, add one in Settings</h1>
                  </>
              )
            }
          }}/>
        </div>
      </AuthContext.Provider>
  );
}

export default App;
