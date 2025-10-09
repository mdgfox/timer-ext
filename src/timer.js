const TIMER_CONFIG = {
    DURATION: 60,
    FINAL_PHASE_DURATION: 10,
    PHASE_STOPS: {
        standard: [],
        duplet: [30],
        blitz: [40, 20],
    },
    RADIUS: 150,
};

let intervalId = null;
let finalPhaseTimer = null;
let remaining = TIMER_CONFIG.DURATION;
let currentPhase = 0;
let waitingForResume = false;
let mode = "standard";
let isFinalPhase = false;

const CIRCUMFERENCE = 2 * Math.PI * TIMER_CONFIG.RADIUS;

const display = document.getElementById("display");
const ring = document.querySelector(".ring");
const playButton = document.getElementById("play");
const beepSound = document.getElementById("beep");
const finalText = document.getElementById("final-phase-text");
const modesContainer = document.getElementById("modes-container");

ring.style.strokeDasharray = CIRCUMFERENCE;
ring.style.strokeDashoffset = 0;

function startFinalPhaseCountdown() {
    isFinalPhase = true;
    remaining = TIMER_CONFIG.FINAL_PHASE_DURATION;
    updateDisplay();
    display.classList.add("final-phase");
    finalText.classList.add("visible");

    finalPhaseTimer = setInterval(() => {
        remaining--;
        updateDisplay();

        const progress =
            (TIMER_CONFIG.DURATION - remaining) / TIMER_CONFIG.DURATION;
        setProgress(progress);

        if (remaining <= 0) {
            clearInterval(finalPhaseTimer);
            handleFinalPhaseEnd();
        }
    }, 1000);
}

function handleFinalPhaseEnd() {
    display.classList.remove("final-phase");
    finalText.classList.remove("visible");

    beepSound.play();
    isFinalPhase = false;

    resetTimerState();
}

function setProgress(percent) {
    const offset = percent * CIRCUMFERENCE;
    ring.style.strokeDashoffset = offset;
}

function updateDisplay() {
    setDisplayText(remaining);
}

function setDisplayText(text) {
    display.textContent = text;
}

function setRingProgress(percent) {
    const offset = percent * CIRCUMFERENCE;
    ring.style.strokeDashoffset = offset;
}

function setPlayButtonState(isRunning) {
    playButton.textContent = isRunning ? "◼" : "▶";
    playButton.classList.toggle("running", isRunning);
}

function setFinalPhaseVisibility(isVisible) {
    finalText.classList.toggle("visible", isVisible);
    display.classList.toggle("final-phase", isVisible);
}

function stopTimerInterval() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    playButton.textContent = "▶";
    playButton.classList.remove("running");
}

function handleStartButton() {
    if (waitingForResume) {
        waitingForResume = false;
        beepSound.currentTime = 0;
        beepSound.play();
        runTimerInterval();
        return;
    }

    stopTimerInterval();
    resetTimerState();
    beepSound.currentTime = 0;
    beepSound.play();

    showTemporaryText("Время!");

    runTimerInterval();
}

function runTimerInterval() {
    stopTimerInterval();
    updateDisplay();

    playButton.textContent = "◼";
    playButton.classList.add("running");

    const stops = TIMER_CONFIG.PHASE_STOPS[mode];
    const nextStop = stops[currentPhase] || 0;
    const phaseEnd = nextStop;

    intervalId = setInterval(() => {
        remaining--;
        updateDisplay();

        if (mode === "standard" && remaining === 10) {
            showTemporaryText("Осталось 10 секунд!");
            beepSound.currentTime = 0;
            beepSound.play();
        }

        const progress =
            (TIMER_CONFIG.DURATION - remaining) / TIMER_CONFIG.DURATION;
        setProgress(progress);

        if (!isFinalPhase && remaining <= phaseEnd) {
            clearInterval(intervalId);
            handlePhaseEnd();
        }
    }, 1000);
}

function handlePhaseEnd() {
    beepSound.currentTime = 0;
    beepSound.play();

    const stops = TIMER_CONFIG.PHASE_STOPS[mode];

    if (currentPhase < stops.length) {
        waitingForResume = true;
        currentPhase++;
        playButton.textContent = "▶";
        playButton.classList.remove("running");
        return;
    }

    if (!isFinalPhase) {
        startFinalPhaseCountdown();
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
    resetTimerState();
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

function showTemporaryText(message, cssClass, durationMs = 3000) {
    displayTempText(message, cssClass, durationMs);
}

function resetTimerState() {
    remaining = TIMER_CONFIG.DURATION;
    currentPhase = 0;
    waitingForResume = false;
    isFinalPhase = false;
    updateDisplay();
    setProgress(0);
    finalText.classList.remove("visible");
    display.classList.remove("final-phase");
}

playButton.addEventListener("click", () => {
    const activeMode = document.querySelector(".mode.active");
    if (!activeMode) {
        return;
    }
    mode = activeMode.dataset.mode;

    if (waitingForResume) {
        handleStartButton();
        return;
    }

    if (intervalId !== null) {
        stopTimerInterval();
        resetTimerState();
        return;
    }

    handleStartButton();
});

modesContainer.addEventListener("click", (e) => {
    const modeElement = e.target.closest(".mode");

    if (modeElement) {
        selectMode(modeElement);
    }
});

updateMarkers(mode);
