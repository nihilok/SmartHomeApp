import React from 'react';
import {useAuthContext} from "../contexts/AuthContext";

export function useFetchWithToken() {

  const {authState} = useAuthContext();

  return async function (url, method = 'GET', body = null) {

    const headers = new Headers({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authState.token}`
    })

    const fetchState = {
      headers,
      method
    }
    if (body) {
      fetchState.body = JSON.stringify(body)
    }

    return await fetch(url, fetchState)

  }
}