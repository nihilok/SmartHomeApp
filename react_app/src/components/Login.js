import React, {useRef, useContext, useState} from 'react';
import {AuthContext} from "../contexts/AuthContext";
import Loader from "./Loader";

const Login = () => {
  const {authState, authDispatch} = useContext(AuthContext)

  const initialState = {
    username: "",
    password: "",
    isSubmitting: false,
    errorMessage: null
  };

  const [data, setData] = useState(initialState);
  const handleInputChange = event => {
    setData({
      ...data,
      [event.target.name]: event.target.value
    });
  };
  const form = useRef(null)
  const handleSubmit = (evt) => {
    evt.preventDefault();
    setData({
      ...data,
      isSubmitting: true,
      errorMessage: null
    });
    let formData = new FormData(form.current)
    fetch(`${authState.apiBaseUrl}/token/`,
        {
          method: 'POST',
          body: formData
        }).then(res => {
      if (res.status === 200) {
        return res.json();
      }
      throw res;
    })
        .then(resJson => {
          authDispatch({
            type: "LOGIN",
            payload: resJson
          });
        })
        .catch(error => {
          setData({
            ...data,
            isSubmitting: false,
            errorMessage: error.message || error.statusText
          });
        });
  };

  return (
      <div className="Login-screen container">
        <form ref={form} onSubmit={handleSubmit} className={"Login-form"}>
          <div className="form-control">
            <input name="username" type="text"
                   placeholder="Username"
                   value={data.username}
                   onChange={handleInputChange}
                   className=""/>
            <input name="password" type="password" placeholder="Password"
                   value={data.password}
                   onChange={handleInputChange}
                   className=""/>
            <input type="submit" value="Sign In"
                   className="btn"/>
          </div>

          {data.isSubmitting ? <Loader/> : ''}
        </form>
      </div>
  )
};

export default Login;