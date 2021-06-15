import React from 'react'

export const AuthContext = React.createContext(); // added this

export const initialState = {
    isAuthenticated: false,
    // user: null,
    token: localStorage.getItem('token'),
    apiBaseUrl: `https://server.smarthome.mjfullstack.com`,
    // apiBaseUrl: `http://localhost:8000`
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