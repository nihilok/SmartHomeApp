import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import './css/index.css';
import './css/inputs.css';
import './css/components.css';
import './css/toast.css';
import './css/loaders.css';
import './css/planner.css';
import './css/note.css';
import './css/check-slider.css';
import './css/custom-range-input.css';
import App from './App';
import {library} from '@fortawesome/fontawesome-svg-core'
import {
    faBaby,
    faCog,
    faPizzaSlice,
    faFireAlt,
    faShoppingCart,
    faRoute,
    faMusic,
    faTasks,
    faMoneyBillWave,
    faArrowLeft,
    faTimes,
    faVideo,
    faCheckCircle,
    faClock,
    faCalendarAlt
} from '@fortawesome/free-solid-svg-icons'
import {BrowserRouter as Router} from "react-router-dom";
import {ToastProvider} from "./contexts/ToastContext";

library.add(faBaby, faCog, faCalendarAlt, faClock, faPizzaSlice, faFireAlt, faShoppingCart, faRoute, faMusic, faTasks, faMoneyBillWave, faArrowLeft, faTimes, faVideo, faCheckCircle)


ReactDOM.render(
    <React.StrictMode>
        <Router>
            <ToastProvider>
                <App/>
            </ToastProvider>
        </Router>
    </React.StrictMode>,
    document.getElementById('root')
);

serviceWorkerRegistration.register()
