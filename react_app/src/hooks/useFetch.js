import {useReducer, useEffect, useRef} from "react";

export const apiBaseUrl = 'https://server.smarthome.mjfullstack.com'

const initialState = {
  status: 'idle',
  error: null,
  data: [],
};

export const returnHeaders = (token) => {
  return new Headers({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  })
}


export const useFetch = (url, method, authState, body = null) => {

  const cache = useRef({});
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'FETCHING':
        return {...initialState, status: 'fetching'};
      case 'FETCHED':
        return {...initialState, status: 'fetched', data: action.payload};
      case 'FETCH_ERROR':
        return {...initialState, status: 'error', error: action.payload};
      default:
        return state;
    }
  }, initialState);

  useEffect(() => {
    let cancelRequest = false;
    if (!url) return;

    const fetchData = async () => {
      dispatch({type: 'FETCHING'});
      if (cache.current[url]) {
        const data = cache.current[url];
        dispatch({type: 'FETCHED', payload: data});
      } else {
        try {
          const init = {
            headers: returnHeaders(authState.token),
            method,
          }
          if (body) {
            init.body = JSON.stringify(body)
          }
          console.log(init)
          const response = await fetch(apiBaseUrl + url, init);
          const data = await response.json();
          cache.current[url] = data;
          if (cancelRequest) return;
          dispatch({type: 'FETCHED', payload: data});
        } catch (error) {
          if (cancelRequest) return;
          dispatch({type: 'FETCH_ERROR', payload: error.message});
        }
      }
    };

    fetchData();

    return function cleanup() {
      cancelRequest = true;
    };
  }, [authState.token, body, method, url]);
  return state;
}

export default useFetch;