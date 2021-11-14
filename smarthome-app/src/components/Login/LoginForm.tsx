import * as React from "react";
import "./login.css";
import useAuthContext from "../../context/AuthContext";
import { useHistory } from "react-router-dom";
import { StyledTextField } from "../Custom/StyledTextField";
import { Button } from "@mui/material";
import { FullScreenLoader } from "../Loaders/FullScreenLoader";

export default function LoginForm() {
  const { context, dispatch } = useAuthContext();
  let history = useHistory();

  const checkToken = React.useCallback(() => {
    const localToken: string | null = localStorage.getItem("token");
    if (!localToken) return;
    const token = JSON.parse(localToken);
    fetch(`${context.apiBaseUrl}/check_token/`, {
      method: "POST",
      body: JSON.stringify(token),
    }).then((response) =>
      response.json().then((data) => {
        if (response.status !== 200) {
          dispatch({ type: "LOGOUT" });
        } else {
          dispatch({
            type: "LOGIN",
            payload: data,
          });
        }
      })
    );
  }, [context, dispatch]);

  React.useEffect(() => {
    console.log("Checking token");
    checkToken();
  }, [checkToken]);

  const initialState = {
    username: "",
    password: "",
    isSubmitting: false,
    errorMessage: null,
  };

  const [data, setData] = React.useState(initialState);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [event.target.name]: event.target.value,
    });
  };

  const formRef = React.useRef<HTMLFormElement>(null);

  function logIn(evt: React.FormEvent) {
    evt.preventDefault();
    let formData;
    setData({
      ...data,
      isSubmitting: true,
      errorMessage: null,
    });
    console.log(data);
    if (formRef.current) formData = new FormData(formRef.current);
    fetch(`${context.apiBaseUrl}/token/`, {
      method: "POST",
      body: formData,
    })
      .then((res) =>
        res.json().then((resJson) => {
          if (res.status === 200) {
            dispatch({
              type: "LOGIN",
              payload: resJson,
            });
            history.push("/");
          }
        })
      )
      .catch((error) => {
        setData({
          ...data,
          isSubmitting: false,
          errorMessage: error.message || error.statusText,
        });
      });
  }

  return data.isSubmitting ? (
    <FullScreenLoader />
  ) : (
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
      <div className={"inline-error-message"}>{data.errorMessage}</div>
    </form>
  );
}
