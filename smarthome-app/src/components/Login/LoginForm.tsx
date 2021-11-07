import * as React from 'react';
import './login.css';
import {useAuthContext} from "../../context/AuthContext";
import {useHistory, useParams} from "react-router-dom";
import {useCallback} from "react";

export function LoginForm() {

    const {context, dispatch} = useAuthContext();
    let history = useHistory();
    const {from} = useParams<{from: string}>();

    const checkToken = useCallback(() => {
        const localToken: string | null = localStorage.getItem('token')
        if (!localToken) return;
        const token = JSON.parse(localToken)
        fetch(`${context.apiBaseUrl}/check_token/`,
            {
                method: 'POST',
                body: JSON.stringify(token)
            })
            .then(response => response.json()
                .then(data => {
                    if (response.status !== 200) {
                        dispatch({type: "LOGOUT"})
                    } else {
                        dispatch({
                            type: "LOGIN",
                            payload: data
                        });
                        history.length ? history.goForward() : history.push('/')
                    }

                })
            )
    }, [context, dispatch, history])

    React.useEffect(()=>{
        console.log('Checking token')
        checkToken()
    },[checkToken])

    const initialState = {
        username: "",
        password: "",
        isSubmitting: false,
        errorMessage: null
    };

    const [data, setData] = React.useState(initialState);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setData({
            ...data,
            [event.target.name]: event.target.value
        });
    };

    const formRef = React.useRef<HTMLFormElement>(null);

    function logIn(evt: React.FormEvent) {
        evt.preventDefault();
        let formData;
        setData({
            ...data,
            isSubmitting: true,
            errorMessage: null
        });
        console.log(data)
        if (formRef.current)
            formData = new FormData(formRef.current);
        fetch(`${context.apiBaseUrl}/token/`,
            {
                method: 'POST',
                body: formData
            }).then(res => res.json().then(resJson => {
                if (res.status === 200) {
                    dispatch({
                        type: "LOGIN",
                        payload: resJson
                    })
                    history.push('/')
                }
            }
        )).catch(error => {
            setData({
                ...data,
                isSubmitting: false,
                errorMessage: error.message || error.statusText
            })
        })
    }

    return (
        <form onSubmit={logIn} ref={formRef} className={'login-form'}>
            <h1>Log In</h1>
            <input placeholder="Username" type="text" onChange={handleInputChange} name='username'/>
            <input placeholder="Password" type="password" onChange={handleInputChange} name='password'/>
            <input type="submit" value="Login"/>
            <div className={'inline-error-message'}>{data.errorMessage}</div>
        </form>
    );
}