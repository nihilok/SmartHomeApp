async function FetchWithToken(url,
                              method,
                              authState = null,
                              setFetchData = null,
                              body = null,
                              toastDispatch = null) {

  const rejectedToast = (message) => {
    toastDispatch({
      type: 'ADD',
      payload: {
        content: message,
        type: 'danger'
      }
    });
  }

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
              case ([401, 403].includes(res.status)):
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
            console.log('HERE:')
          }
          res.json().then(data => console.error(data))
        } else {
          res.json().then(data => {
            if (setFetchData) {
              setFetchData(data)
            } else {
              return data
            }
          })
        }
      })
}

export function autoLogout (authDispatch, toastDispatch) {
  toastDispatch({
      type: 'ADD',
      payload: {
        content: 'You have been logged out!',
        type: 'danger'
      }
    });
  authDispatch({type: 'LOGOUT'})
}

export default FetchWithToken;