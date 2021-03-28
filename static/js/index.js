
function loadData() {
    var tempDisplay = document.getElementById('tempDisplay')
    var timeDisplay = document.getElementById('timeDisplay')
    var weather = document.getElementById('weather')
    var outdoorTemp = document.getElementById('outdoorTemp')
    fetch(`${window.origin}/api`)
    .then(function(response){
        if (response.status !== 202) {
            alert(`Bad response from temperature api: ${response.status}`)
            return ;
        }
        response.json().then(function(data){
            tempDisplay.innerHTML = data.indoor_temp
//            timeDisplay.innerHTML = data.current_time
            weather.innerHTML = data.weather
            outdoorTemp.innerHTML = data.outdoor_temp
        })
    })
}

function loadUrl(newLocation){
  window.location = newLocation;
  return false;
}

var pwdInput = document.getElementById('passwd')

function login() {
    var passwd = md5(pwdInput.value)
    var pwd = {passwd : passwd}
    fetch(`${window.origin}/login`, {
        method: "POST",
        redirect: "follow",
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(pwd)
    }).then(function(response){
        if (response.status !== 200) {
            alert(`Bad response from api: ${response.status}`)
            return ;
        }
        response.json().then(function(data){
            loadUrl(data.redirect_url)
        })
    });
}

function returnCurrentTime() {
    var ct = new Date().toLocaleTimeString()
    return ct
}

function switchOn(com) {
    var command = {
        command: com
    }
    fetch(`${window.origin}/switch`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(command)
    }).then(function(response){
        if (response.status !== 200) {
            alert(`Bad response from api: ${response.status}`)
            return ;
        }
        location.reload()
    });
}

function endPoint(url_string) {
    loadUrl(`${window.origin}/${url_string}`)
}

function changeStation(btn) {
    var station = btn.innerHTML.toLowerCase()
    fetch(`${window.origin}/music`, {method: 'POST', headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        }, body: JSON.stringify({station: station})})
    .then(function(response){
        if (response.status !== 200) {
            alert(`Bad response from radio api: ${response.status}`)
            return ;
        }
    })
}

function killStation() {
    fetch(`${window.origin}/music`, {method: 'POST', headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        }, body: JSON.stringify({kill: true})})
    .then(function(response){
        if (response.status !== 200) {
            alert(`Bad response from radio api: ${response.status}`)
            return ;
        }
    })
}