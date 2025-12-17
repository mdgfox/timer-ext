const CONFIG = {
    standard: [60, 10],
    duplet: [30, 30, 10],
    blitz: [20, 20, 20, 10],
    RADIUS: 150,
};

const CIRCUMFERENCE = 2 * Math.PI * CONFIG.RADIUS;
const ring = document.getElementById("progress-ring");
const recordRing = document.getElementById("record-ring");
const display = document.getElementById("display");
const statusText = document.getElementById("status-text");
const playBtn = document.getElementById("play");
const beep = document.getElementById("beep");

const icons = {
    play: document.getElementById("icon-play"),
    pause: document.getElementById("icon-pause"),
    stop: document.getElementById("icon-stop"),
};

let currentMode = "standard";
let phaseIndex = 0;
let remaining = 0;
let intervalId = null;
let isAutoPaused = false;
let statusTimeout = null;

ring.style.strokeDasharray = CIRCUMFERENCE;
recordRing.style.strokeDasharray = CIRCUMFERENCE;

function setIcon(name) {
    Object.values(icons).forEach((icon) => (icon.style.display = "none"));
    icons[name].style.display = "block";
}

function playSignal() {
    beep.currentTime = 0;
    beep.play().catch((e) => console.log("Audio play failed:", e));
}

function showStatus(text, type = "") {
    clearTimeout(statusTimeout);
    statusText.textContent = text;
    statusText.className = "status-text visible " + type;

    statusTimeout = setTimeout(() => {
        statusText.classList.remove("visible");
    }, 3000);
}

function updateUI() {
    const phases = CONFIG[currentMode];
    const isFinalPhase = phaseIndex === phases.length - 1;

    let displayTime;
    if (!isFinalPhase && currentMode === "duplet") {
        displayTime = phaseIndex === 0 ? remaining + 30 : remaining;
    } else if (!isFinalPhase && currentMode === "blitz") {
        if (phaseIndex === 0) displayTime = remaining + 40;
        else if (phaseIndex === 1) displayTime = remaining + 20;
        else displayTime = remaining;
    } else {
        displayTime = remaining;
    }
    display.textContent = displayTime;

    if (isFinalPhase) {
        const percent = remaining / phases[phases.length - 1];
        recordRing.style.strokeDashoffset = CIRCUMFERENCE * (1 - percent);
        ring.style.strokeDashoffset = CIRCUMFERENCE;

        display.classList.remove("warning");
        display.classList.add("final");
    } else {
        let percent =
            currentMode === "standard" ? remaining / 60 : displayTime / 60;
        ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - percent);
        recordRing.style.strokeDashoffset = CIRCUMFERENCE;

        if (currentMode === "standard" && remaining <= 10 && remaining > 0) {
            display.classList.add("warning");
        } else {
            if (remaining > 10) display.classList.remove("warning", "final");
        }
    }
}
function stopTimerForPause() {
    clearInterval(intervalId);
    intervalId = null;
    isAutoPaused = true;
    setIcon("play");
}

function nextPhase() {
    playSignal();
    phaseIndex++;
    const phases = CONFIG[currentMode];

    if (phaseIndex >= phases.length) {
        resetApp();
        return;
    }

    remaining = phases[phaseIndex];

    if (phaseIndex === phases.length - 1) {
        showStatus("10 секунд на запись!", "final");
        recordRing.style.transition = "none";
        recordRing.style.strokeDashoffset = 0;
        recordRing.getBoundingClientRect();
        recordRing.style.transition = "stroke-dashoffset 1s linear";
    } else {
        showStatus(`Вопрос ${phaseIndex + 1}`);
    }

    const isDupletPause = currentMode === "duplet" && phaseIndex === 1;
    const isBlitzPause =
        currentMode === "blitz" && (phaseIndex === 1 || phaseIndex === 2);

    if (isDupletPause || isBlitzPause) stopTimerForPause();
    updateUI();
}

function tick() {
    remaining--;
    if (currentMode === "standard" && phaseIndex === 0 && remaining === 10) {
        playSignal();
        showStatus("Осталось 10 секунд", "warning");
    }

    if (remaining < 0) {
        nextPhase();
    } else {
        updateUI();
    }
}

function startActiveTimer() {
    playSignal();
    if (
        phaseIndex === 0 &&
        remaining === CONFIG[currentMode][0] &&
        !isAutoPaused
    ) {
        if (currentMode !== "standard") showStatus("Вопрос 1");
    }
    isAutoPaused = false;
    setIcon("stop");
    intervalId = setInterval(tick, 1000);
}

playBtn.addEventListener("click", () => {
    if (isAutoPaused || !intervalId) startActiveTimer();
    else resetApp();
});

function resetApp() {
    clearInterval(intervalId);
    intervalId = null;
    isAutoPaused = false;
    phaseIndex = 0;

    const phases = CONFIG[currentMode];
    remaining = phases[0];

    setIcon("play");

    display.classList.remove("final", "warning");
    statusText.classList.remove("visible", "final", "warning");

    ring.style.transition = "none";
    recordRing.style.transition = "none";
    updateUI();

    setTimeout(() => {
        ring.style.transition = "stroke-dashoffset 1s linear";
        recordRing.style.transition = "stroke-dashoffset 1s linear";
    }, 50);
}

document.getElementById("modes-container").addEventListener("click", (e) => {
    const btn = e.target.closest(".mode");
    if (!btn || intervalId) return;
    document
        .querySelectorAll(".mode")
        .forEach((m) => m.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode;
    resetApp();
});

resetApp();
