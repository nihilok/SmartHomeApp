function loadUrl(newLocation){
  window.location = newLocation;
  return false;
}

function digits_count(n) {
        var count = 0;
        if (n >= 1) ++count;

        while (n / 10 >= 1) {
          n /= 10;
          ++count;
        }

        return count;
      }

function countDownTimer(){
  // Set the date we're counting down to
  var countDownDate = new Date(document.getElementById('time').innerHTML).getTime();

  // Update the count down every 1 second
  var x = setInterval(function() {

  // Get today's date and time
  var now = new Date().getTime();

  // Find the distance between now and the count down date
  var distance = now - countDownDate;

  // Time calculations for hours, minutes and seconds
  var minutes = Math.floor((15 - (distance % (1000 * 60 * 60)) / (1000 * 60)));
  var seconds = Math.floor((60 - (distance % (1000 * 60)) / 1000));

  // Display the result in the element with id="countdown"
  if (digits_count(seconds) > 1){
    document.getElementById("advanceBtn").innerHTML =  minutes + ":" + seconds;
  } else {
    document.getElementById("advanceBtn").innerHTML =  minutes + ":0" + seconds;
  }

  // If the count down is finished, write some text
  if (distance > 15 * 60 * 1000) {
    clearInterval(x);
    document.getElementById("advanceBtn").innerHTML = "END"
    setTimeout(function() {
      location.reload();
    }, 2000);
  }
  }, 1000);
}

function disableAdvance() {
  var advanceBtn = document.getElementById('advanceBtn')
  advanceBtn.onmouseover = ''
  advanceBtn.onclick = ''
  $('#advanceBtn').addClass('disabled')
//  advanceBtn.style.cursor = 'none'
}

function getTemp(){
    var tempDisplay = document.getElementById('tempDisplay')
    var temp = document.getElementById('temp')
    fetch(`${window.origin}/temp`)
    .then(function(response){
        if (response.status !== 200) {
            alert(`Bad response from temperature api: ${response.status}`)
            return ;
        }
        response.json().then(function(data){
            tempDisplay.innerHTML = data.temp
            if (data.on == 1){
              temp.style.color = 'red'
            } else {
              temp.style.color = 'white'
            }
        })
    })
}

setInterval(getTemp, 3000)