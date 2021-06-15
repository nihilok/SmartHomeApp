import React from 'react';
import ReactDOM from 'react-dom';
import './css/index.css';
import './css/components.css';
import './css/toast.css';
import './css/loaders.css';
import './css/check-slider.css';
import './css/custom-range-input.css';
import App from './App';
import {library} from '@fortawesome/fontawesome-svg-core'
import {
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
} from '@fortawesome/free-solid-svg-icons'
import {BrowserRouter as Router} from "react-router-dom";
import {ToastProvider} from "./contexts/ToastContext";

library.add(faCog, faClock, faPizzaSlice, faFireAlt, faShoppingCart, faRoute, faMusic, faTasks, faMoneyBillWave, faArrowLeft, faTimes, faVideo, faCheckCircle)


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
