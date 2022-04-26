import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import styles from './App.module.css'
import RouterSwitch from "./components/Router/RouterSwitch";
import {AuthContextProvider} from "./context/AuthContext";
import {SnackBarProvider} from "./context/SnackBarContext";

function App() {
  return (
    <div className={styles.AppContainer}>
      <AuthContextProvider>
        <Router>
          <SnackBarProvider>
            <RouterSwitch />
          </SnackBarProvider>
        </Router>
      </AuthContextProvider>
    </div>
  );
}

export default App;
