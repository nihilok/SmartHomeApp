import {useAuthContext} from "../context/AuthContext";

type Body = {} | null

export function useFetchWithToken() {

  const {context} = useAuthContext();

  return async function (url: string, method: string = 'GET', body: Body = null) {

    const headers = new Headers({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${context.token}`
    })

    interface iFetchState {
      headers: Headers;
      method: string;
      body?: string;
    }

    const fetchState: iFetchState = {
      headers,
      method
    }
    if (body) {
      fetchState.body = JSON.stringify(body)
    }

    return await fetch(url, fetchState)
  }
}