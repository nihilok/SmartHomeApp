import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "./components/Custom/layouts.css";
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext";
import { SnackbarProvider } from "notistack";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import reportWebVitals from "./reportWebVitals";
import { createTheme, ThemeProvider } from "@mui/material";
import blue from "@mui/material/colors/blue";
import orange from "@mui/material/colors/orange";

const theme = createTheme({
  palette: {
    primary: orange,
    secondary: blue,
  },
});

ReactDOM.render(
  <React.StrictMode>
    <AuthContextProvider>
      <ThemeProvider theme={theme}>
        <SnackbarProvider maxSnack={3}>
          <Router>
            <App />
          </Router>
        </SnackbarProvider>
      </ThemeProvider>
    </AuthContextProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

serviceWorkerRegistration.register();

reportWebVitals();
