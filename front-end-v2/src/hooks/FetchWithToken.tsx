import useAuthContext from "../context/AuthContext";
import * as React from "react";

type Body = {} | null;

export function useFetchWithToken() {
  const { context } = useAuthContext();

  return React.useCallback(async function (
    url: string,
    method: string = "GET",
    body: Body = null
  ) {
    const headers = new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${context.token?.access_token ?? ''}`,
    })


    interface iFetchState {
      headers: Headers;
      method: string;
      body?: string;
    }

    const fetchState: iFetchState = {
      headers,
      method,
    };
    if (body) {
      fetchState.body = JSON.stringify(body);
    }

    return await fetch(context.apiBaseUrl + url, fetchState);
  }, [context.apiBaseUrl, context.token])
}
