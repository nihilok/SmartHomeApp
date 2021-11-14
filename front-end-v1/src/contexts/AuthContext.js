import React from 'react'

export const apiBaseUrl = 'http://localhost:8080'

export const AuthContext = React.createContext();

export const param = "ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnpkV0lpT2lKemJXRnlkR2h2YldVaUxDSmxlSEFpT2pFMk5qWXhNalF5TXpSOS5Jd3QzRzZQYjlMVlNDb0VLQ3M5SS1JOTQwbDZ4V2ZFaVdaS0dlTTk5RXlN"


export const initialState = {
  isAuthenticated: false,
  token: localStorage.getItem('token'),
  apiBaseUrl: apiBaseUrl,
  camUrl: camUrl,
  darkMode: JSON.parse(localStorage.getItem('dark-mode'))
};

export const reducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      localStorage.setItem("token", JSON.stringify(action.payload.access_token));
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.access_token
      };
    case "LOGOUT":
      localStorage.clear();
      return {
        ...state,
        isAuthenticated: false,
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
        darkMode: !state.darkMode,
      };

    default:
      return state;
  }
};

export const useAuthContext = () => {
  return React.useContext(AuthContext)
}