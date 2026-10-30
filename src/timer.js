const CONFIG = {
    standard: [60, 10],
    duplet: [30, 30, 10],
    blitz: [20, 20, 20, 10],
    RADIUS: 150,
};

const MODE_KEYS = {
    Digit1: "standard",
    Numpad1: "standard",
    Digit2: "duplet",
    Numpad2: "duplet",
    Digit3: "blitz",
    Numpad3: "blitz",
};

const CIRCUMFERENCE = 2 * Math.PI * CONFIG.RADIUS;
const ring = document.getElementById("progress-ring");
const recordRing = document.getElementById("record-ring");
const display = document.getElementById("display");
const statusText = document.getElementById("status-text");
const playBtn = document.getElementById("play");
const phaseLabel = document.getElementById("phase-label");
const modesContainer = document.getElementById("modes-container");

const sounds = {
    start: document.getElementById("sound-start"),
    next: document.getElementById("sound-next"),
    warning: document.getElementById("sound-warning"),
    record: document.getElementById("sound-record"),
};

const icons = {
    play: document.getElementById("icon-play"),
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

    const label =
        name === "stop"
            ? "Остановить и сбросить"
            : isAutoPaused
              ? `Начать вопрос ${phaseIndex + 1}`
              : "Старт";
    playBtn.setAttribute("aria-label", label);
    playBtn.title = `${label} (Пробел)`;
}

function setModesLocked(locked) {
    modesContainer.classList.toggle("locked", locked);
    modesContainer.setAttribute("aria-disabled", locked);
    modesContainer.title = locked ? "Остановите таймер, чтобы сменить режим" : "";
}

function playSignal(name) {
    const sound = sounds[name];
    sound.currentTime = 0;
    sound.play().catch((e) => console.log("Audio play failed:", e));
}

function showStatus(text, type = "", sticky = false) {
    clearTimeout(statusTimeout);
    statusText.textContent = text;
    statusText.className = "status-text visible " + type;
    if (sticky) return;

    statusTimeout = setTimeout(() => {
        statusText.classList.remove("visible");
    }, 3000);
}

function updateUI() {
    const phases = CONFIG[currentMode];
    const isFinalPhase = phaseIndex === phases.length - 1;
    const isWarning =
        !isFinalPhase &&
        currentMode === "standard" &&
        remaining <= 10 &&
        remaining >= 0;

    if (isFinalPhase) phaseLabel.textContent = "Запись ответа";
    else if (isWarning) phaseLabel.textContent = "Последние секунды";
    else if (currentMode === "standard") phaseLabel.textContent = "Вопрос";
    else
        phaseLabel.textContent = `Вопрос ${phaseIndex + 1} из ${phases.length - 1}`;
    display.classList.toggle("paused", isAutoPaused);

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

        if (isWarning) {
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
    setModesLocked(false);
}

function nextPhase() {
    phaseIndex++;
    const phases = CONFIG[currentMode];
    playSignal(phaseIndex === phases.length - 1 ? "record" : "next");

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

    if (isDupletPause || isBlitzPause) {
        stopTimerForPause();
        showStatus("Пауза — нажмите кнопку", "pause", true);
    }
    updateUI();
}

function tick() {
    remaining--;
    if (currentMode === "standard" && phaseIndex === 0 && remaining === 10) {
        playSignal("warning");
        showStatus("Осталось 10 секунд", "warning");
    }

    if (remaining < 0) {
        nextPhase();
    } else {
        updateUI();
    }
}

function startActiveTimer() {
    playSignal("start");
    if (
        phaseIndex === 0 &&
        remaining === CONFIG[currentMode][0] &&
        !isAutoPaused
    ) {
        if (currentMode !== "standard") showStatus("Вопрос 1");
    } else if (isAutoPaused) {
        showStatus(`Вопрос ${phaseIndex + 1}`);
    }
    isAutoPaused = false;
    display.classList.remove("paused");
    setIcon("stop");
    setModesLocked(true);
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
    setModesLocked(false);

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

function selectMode(btn) {
    modesContainer.querySelectorAll(".mode").forEach((m) => {
        const isActive = m === btn;
        m.classList.toggle("active", isActive);
        m.setAttribute("aria-checked", isActive);
        m.tabIndex = isActive ? 0 : -1;
    });
    currentMode = btn.dataset.mode;
    resetApp();
}

modesContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".mode");
    if (!btn || intervalId) return;
    selectMode(btn);
});

modesContainer.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
        e.key
    ];
    if (!step || intervalId) return;

    const modes = [...modesContainer.querySelectorAll(".mode")];
    const current = modes.indexOf(document.activeElement);
    const next = modes[(current + step + modes.length) % modes.length];
    e.preventDefault();
    next.focus();
    selectMode(next);
});

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;

    if (e.code === "Space") {
        // The focused main button handles Space natively
        if (e.target.closest(".fab-button")) return;
        e.preventDefault();
        playBtn.click();
        return;
    }

    const mode = MODE_KEYS[e.code];
    if (mode && !intervalId) {
        const btn = modesContainer.querySelector(`.mode[data-mode="${mode}"]`);
        btn.focus();
        selectMode(btn);
    }
});

document.addEventListener("keyup", (e) => {
    // Chrome clicks a focused button on Space keyup, which would re-select a mode
    if (e.code === "Space" && !e.target.closest(".fab-button")) e.preventDefault();
});

resetApp();
