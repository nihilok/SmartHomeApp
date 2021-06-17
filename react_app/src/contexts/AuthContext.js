import React from 'react'
import {apiBaseUrl} from "../service/FetchService";

export const AuthContext = React.createContext();


export const initialState = {
    isAuthenticated: false,
    // user: null,
    token: localStorage.getItem('token'),
    apiBaseUrl: apiBaseUrl,
};

export const reducer = (state, action) => {
    switch (action.type) {
        case "LOGIN":
            // localStorage.setItem("user", JSON.stringify(action.payload.user));
            localStorage.setItem("token", JSON.stringify(action.payload.access_token));
            return {
                ...state,
                isAuthenticated: true,
                // user: action.payload.user,
                token: action.payload.access_token
            };
        case "LOGOUT":
            localStorage.clear();
            return {
                ...state,
                isAuthenticated: false,
                // user: null
            };

        default:
            return state;
    }
};