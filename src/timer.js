let intervalId = null;
let rounds = 0;
let currentRound = 0;
let remaining = 0;
let duration = 0;

const display = document.getElementById("display");
const tickSound = document.getElementById("tick");
const beepSound = document.getElementById("beep");
const ring = document.querySelector(".ring");

const radius = 100;
const circumference = 2 * Math.PI * radius;

ring.style.strokeDasharray = circumference;

function setProgress(percent) {
  const offset = circumference - percent * circumference;
  ring.style.strokeDashoffset = offset;
}

function startTimer(sec, repeat) {
  stopTimer();
  duration = sec;
  rounds = repeat;
  currentRound = 0;
  runRound();
}

function runRound() {
  remaining = duration;
  updateDisplay();
  setProgress(1);

  intervalId = setInterval(() => {
    remaining--;
    updateDisplay();

    // play tick
    tickSound.currentTime = 0;
    tickSound.play();

    setProgress(remaining / duration);

    if (remaining <= 0) {
      clearInterval(intervalId);
      roundFinished();
    }
  }, 1000);
}

function updateDisplay() {
  display.textContent = remaining;
}

function roundFinished() {
  // beep when round is over
  beepSound.currentTime = 0;
  beepSound.play();

  // beep again after 10s
  setTimeout(() => {
    beepSound.currentTime = 0;
    beepSound.play();
  }, 10000);

  currentRound++;
  if (currentRound < rounds) {
    setTimeout(runRound, 1000);
  }
}

function stopTimer() {
  if (intervalId) clearInterval(intervalId);
  display.textContent = "0";
  setProgress(0);
}
