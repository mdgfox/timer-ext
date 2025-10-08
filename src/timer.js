let intervalId = null;
let remaining = 60;
let currentPhase = 0;
let waitingForResume = false;
let mode = "standard";
let isFinalPhase = false;
let finalPhaseTimer = null;

const phaseStops = {
    standard: [],
    duplet: [30],
    blitz: [40, 20],
};

const radius = 150;
const circumference = 2 * Math.PI * radius;

const display = document.getElementById("display");
const ring = document.querySelector(".ring");
const playButton = document.getElementById("play");
const beepSound = document.getElementById("beep");
const finalText = document.getElementById("final-phase-text");
const modesContainer = document.getElementById("modes-container");

ring.style.strokeDasharray = circumference;
ring.style.strokeDashoffset = 0;

function startFinalPhase() {
    isFinalPhase = true;
    remaining = 10;
    display.textContent = remaining;
    display.classList.add("final-phase");
    finalText.classList.add("visible");

    finalPhaseTimer = setInterval(() => {
        remaining--;
        display.textContent = remaining;

        const progress = (60 - remaining) / 60;
        setProgress(progress);

        if (remaining <= 0) {
            clearInterval(finalPhaseTimer);
            endFinalPhase();
        }
    }, 1000);
}

function endFinalPhase() {
    display.classList.remove("final-phase");
    finalText.classList.remove("visible");

    beepSound.play();
    isFinalPhase = false;

    remaining = 60;
    currentPhase = 0;
    waitingForResume = false;

    updateDisplay();
    setProgress(0);
}

function setProgress(percent) {
    const offset = percent * circumference;
    ring.style.strokeDashoffset = offset;
}

function updateDisplay() {
    display.textContent = remaining;
}

function stopTimer() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    playButton.textContent = "▶";
    playButton.classList.remove("running");
}

function startTimer() {
    if (waitingForResume) {
        waitingForResume = false;
        beepSound.currentTime = 0;
        beepSound.play();
        runTimer();
        return;
    }

    stopTimer();
    remaining = 60;
    currentPhase = 0;
    waitingForResume = false;
    isFinalPhase = false;

    beepSound.currentTime = 0;
    beepSound.play();

    displayTempText("Время!");

    runTimer();
}

function runTimer() {
    stopTimer();
    updateDisplay();

    playButton.textContent = "◼";
    playButton.classList.add("running");

    const stops = phaseStops[mode];
    const nextStop = stops[currentPhase] || 0;
    const phaseStart = remaining;
    const phaseEnd = nextStop;

    intervalId = setInterval(() => {
        remaining--;
        updateDisplay();

        if (mode === "standard" && remaining === 10) {
            displayTempText("Осталось 10 секунд!");
        }

        const progress = (60 - remaining) / 60;
        setProgress(progress);

        if (!isFinalPhase && remaining <= phaseEnd) {
            clearInterval(intervalId);
            phaseFinished();
        }
    }, 1000);
}

function phaseFinished() {
    beepSound.currentTime = 0;
    beepSound.play();

    const stops = phaseStops[mode];

    if (currentPhase < stops.length) {
        waitingForResume = true;
        currentPhase++;
        playButton.textContent = "▶";
        playButton.classList.remove("running");
        return;
    }

    if (!isFinalPhase) {
        startFinalPhase();
        return;
    }
}

function updateMarkers(mode) {
    document
        .querySelectorAll(".marker")
        .forEach((m) => m.classList.remove("visible"));

    if (mode === "standard") {
        document.querySelector(".marker-12").classList.add("visible");
    } else if (mode === "duplet") {
        document.querySelector(".marker-12").classList.add("visible");
        document.querySelector(".marker-6").classList.add("visible");
    } else if (mode === "blitz") {
        document.querySelector(".marker-12").classList.add("visible");
        document.querySelector(".marker-4").classList.add("visible");
        document.querySelector(".marker-8").classList.add("visible");
    }
}

function selectMode(el) {
    document
        .querySelectorAll(".mode")
        .forEach((m) => m.classList.remove("active"));
    el.classList.add("active");

    mode = el.dataset.mode;
    updateMarkers(mode);

    stopTimer();
    remaining = 60;
    currentPhase = 0;
    waitingForResume = false;
    isFinalPhase = false;

    updateDisplay();
    setProgress(0);

    finalText.classList.remove("visible");
}

function displayTempText(message, cssClass, durationMs = 3000) {
    const TRANSITION_TIME = 450;

    if (window.hideTextTimeout) {
        clearTimeout(window.hideTextTimeout);
    }
    if (window.resetTextTimeout) {
        clearTimeout(window.resetTextTimeout);
    }

    finalText.textContent = message;
    finalText.classList.add("visible");

    window.hideTextTimeout = setTimeout(() => {
        finalText.classList.remove("visible");

        window.resetTextTimeout = setTimeout(() => {
            finalText.textContent = "10 секунд на запись ответов!";
            finalText.className = "";
        }, TRANSITION_TIME);
    }, durationMs);
}

playButton.addEventListener("click", () => {
    const activeMode = document.querySelector(".mode.active");
    if (!activeMode) {
        return;
    }
    mode = activeMode.dataset.mode;

    if (waitingForResume) {
        startTimer();
        return;
    }

    if (intervalId !== null) {
        stopTimer();

        remaining = 60;
        currentPhase = 0;
        isFinalPhase = false;

        updateDisplay();
        setProgress(0);
        finalText.classList.remove("visible");

        return;
    }

    startTimer();
});

modesContainer.addEventListener("click", (e) => {
    const modeElement = e.target.closest(".mode");

    if (modeElement) {
        selectMode(modeElement);
    }
});

updateMarkers(mode);
