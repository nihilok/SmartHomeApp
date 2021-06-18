import {ADD} from "../contexts/ToastContext";
import {useContext} from "react";
import {AuthContext} from "../contexts/AuthContext";


async function FetchWithToken(url,
                              method,
                              setFetchData = null,
                              body = null,
                              toastDispatch = null) {

  const rejectedToast = (message) => {
    toastDispatch({
      type: ADD,
      payload: {
        content: message,
        type: 'danger'
      }
    });
  }

  const {authState} = useContext(AuthContext)
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
  await fetch(authState.apiBaseUrl + url, fetchInit)
      .then((res) => {
        if (res.status !== 200) {
          if (toastDispatch) {
            switch (true) {
              case (res.status === 401):
                rejectedToast('You are not authorised to do that!')
                break;
              case (res.status === 403):
                rejectedToast('You are not authorised to do that!')
                break;
              case (res.status === 404):
                rejectedToast('Resource not found (404)')
                break;
              case (res.status >= 405):
                rejectedToast('Error processing request')
                break;
              default:
                rejectedToast(`Something went wrong ${res.status}`)
            }
          } else {
            console.log(res)
          }
          throw new Error('Bad response')
        } else {
          return res.json()
        }
      })
      .then(data => {
        if (setFetchData) {
          setFetchData(data)
        }
        return data
      }).catch(e => console.log(e));
}

export default FetchWithToken;