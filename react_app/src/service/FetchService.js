import {ADD} from "../contexts/ToastContext";

export const apiBaseUrl = 'https://server.smarthome.mjfullstack.com'
// export const apiBaseUrl = 'http://localhost:8000'

async function FetchAuthService(url,
                                method,
                                authState,
                                setFetchData,
                                body = null,
                                toastDispatch = null) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authState.token}`
  })
  let fetchInit = {headers, method}
  if (body) {
    fetchInit = {
      ...fetchInit,
      body: body
    }
  }
  await fetch(apiBaseUrl + url, fetchInit)
      .then((res) => res.json()
          .then(data => {
            if (res.status > 400) {
              if (toastDispatch) {
                toastDispatch({
                        type: ADD,
                        payload: {
                            content: 'You are not authorised to do that!',
                            type: 'danger'
                        }
                    });
              }
              return
            }
            setFetchData(data)
          })
      )
}

export default FetchAuthService;