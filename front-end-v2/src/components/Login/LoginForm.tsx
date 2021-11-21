import * as React from "react";
import "./login.css";
import useAuthContext from "../../context/AuthContext";
import { useHistory } from "react-router-dom";
import { StyledTextField } from "../Custom/StyledTextField";
import { Button } from "@mui/material";
import { FullScreenLoader } from "../Loaders/FullScreenLoader";
import { LOGIN, LOGOUT } from "../../context/AuthContext";
import { FullScreenComponent } from "../Custom/FullScreenComponent";
import { useSnackbar } from "notistack";
import { useTelegramDebugMessage } from "../../hooks/TelegramBot";

export default function LoginForm() {
  const { context, dispatch } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const sendMessage = useTelegramDebugMessage();

  const initialState = {
    username: "",
    password: "",
    isSubmitting: true,
    errorMessage: null,
  };

  const [state, setState] = React.useState(initialState);

  let history = useHistory();

  const checkToken = React.useCallback(async () => {
    const localToken: string | null = localStorage.getItem("token");
    if (!localToken) return;
    const token = JSON.parse(localToken);
    fetch(`${context.apiBaseUrl}/check_token/`, {
      method: "POST",
      body: JSON.stringify(token),
    })
      .then((response) =>
        response.json().then((data) => {
          if (response.status !== 200) {
            dispatch({ type: LOGOUT });
            enqueueSnackbar("You have been logged out!");
          } else {
            dispatch({
              type: LOGIN,
              payload: data,
            });
          }
        })
      )
      .catch((error) => {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          errorMessage: error.message || error.statusText,
        }));
      });
  }, [context, dispatch, enqueueSnackbar]);

  React.useEffect(() => {
    console.debug("Checking token");
    let timeout = setTimeout(() => {}, 1);
    checkToken().then(() => {
      setState((p) => ({ ...p, isSubmitting: false }));
    });
    return () => clearTimeout(timeout);
  }, [checkToken]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      [event.target.name]: event.target.value,
    });
  };

  const formRef = React.useRef<HTMLFormElement>(null);

  function logIn(evt: React.FormEvent) {
    evt.preventDefault();
    let formData;
    setState({
      ...state,
      isSubmitting: true,
      errorMessage: null,
    });
    if (formRef.current) formData = new FormData(formRef.current);
    fetch(`${context.apiBaseUrl}/token/`, {
      method: "POST",
      body: formData,
    })
      .then((res) =>
        res.json().then((resJson) => {
          if (res.status !== 200) {
            console.log(resJson);
            throw new Error(resJson.detail);
          }
          dispatch({
            type: "LOGIN",
            payload: resJson,
          });
          history.push("/");
        })
      )
      .catch((error) => {
        setState({
          ...state,
          isSubmitting: false,
          errorMessage: error.message || error.statusText,
        });
      });
  }

  const error = React.useCallback(
    (message: string | null) => {
      if (message) {
        sendMessage(`${window.location.origin}: ${message}`).catch((error) =>
          console.log(error)
        );
        enqueueSnackbar(message, { variant: "error" });
      }
    },
    [enqueueSnackbar, sendMessage]
  );

  React.useEffect(() => {
    error(state.errorMessage);
  }, [error, state.errorMessage]);

  return state.isSubmitting ? (
    <FullScreenLoader />
  ) : (
    <FullScreenComponent>
      <form onSubmit={logIn} ref={formRef} className={"login-form"}>
        <h1>Log In</h1>
        <StyledTextField
          placeholder="Username"
          type="text"
          onChange={handleInputChange}
          name="username"
        />
        <StyledTextField
          placeholder="Password"
          type="password"
          onChange={handleInputChange}
          name="password"
        />
        <Button type="submit">Log In</Button>
      </form>
    </FullScreenComponent>
  );
}
