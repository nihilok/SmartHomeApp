import React from 'react'

export const apiBaseUrl = 'http://localhost:8000'

export const AuthContext = React.createContext();


export const initialState = {
  isAuthenticated: false,
  // user: null,
  token: localStorage.getItem('token'),
  apiBaseUrl: apiBaseUrl,
  darkMode: JSON.parse(localStorage.getItem('dark-mode'))
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
    case "DARKMODE":
      if (!state.darkMode) {
        localStorage.setItem("dark-mode", JSON.stringify(true))
      } else {
        localStorage.setItem("dark-mode", JSON.stringify(false))
      }

      document.body.classList.toggle('dark-mode')

      return {
        ...state,
        darkMode: JSON.parse(localStorage.getItem('dark-mode')),
        // user: null
      };

    default:
      return state;
  }
};