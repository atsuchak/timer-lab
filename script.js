const state = {
    currentTab: 'pomodoro',
    isRunning: false,
    fullscreen: false,
    pomodoro: { focus: 25, break: 5, remaining: 25 * 60, isFocus: true },
    stopwatch: { seconds: 0 },
    intervals: { main: null }
};

const mainDisplay = document.getElementById('main-display');
const mainToggle = document.getElementById('main-toggle');
const modeLabel = document.getElementById('mode-label');
const settingsArea = document.getElementById('settings-area');

function format(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (num) => String(num).padStart(2, '0');

    const hPart = h > 0 ? `<span class="time-block">${pad(h)}</span><span class="colon">:</span>` : "";
    const mPart = `<span class="time-block">${pad(m)}</span>`;
    const sPart = `<span class="colon">:</span><span class="time-block">${pad(s)}</span>`;

    return `${hPart}${mPart}${sPart}`;
}

function switchTab(tab) {
    state.currentTab = tab;
    
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('tab-active', 'text-white');
        btn.classList.add('text-gray-500');
        
        if (btn.dataset.tab === tab) {
            btn.classList.add('tab-active', 'text-white');
            btn.classList.remove('text-gray-500');
        }
    });

    settingsArea.innerHTML = ''; 
    updateUI();
}

function updateUI() {
    let label = "";
    let timeHtml = "";

    if (state.currentTab === 'pomodoro') {
        timeHtml = format(state.pomodoro.remaining);
        label = state.pomodoro.isFocus ? "Focus Session" : "Break Time";

        // FIX: Ensure settings always draw if area is empty
        if (settingsArea.innerHTML.trim() === '') {
            settingsArea.innerHTML = `
                <div class="flex flex-col items-center gap-2">
                    <span class="text-[9px] uppercase text-gray-600 tracking-widest font-bold">Focus</span>
                    <input type="number" id="p-focus" value="${state.pomodoro.focus}" class="w-16 bg-transparent border-b border-[#2a2a2a] text-[#00d4ff] font-timer text-center outline-none focus:border-[#00d4ff] transition-all">
                </div>
                <div class="flex flex-col items-center gap-2">
                    <span class="text-[9px] uppercase text-gray-600 tracking-widest font-bold">Break</span>
                    <input type="number" id="p-break" value="${state.pomodoro.break}" class="w-16 bg-transparent border-b border-[#2a2a2a] text-[#00ff88] font-timer text-center outline-none focus:border-[#00ff88] transition-all">
                </div>
            `;
            attachInputListeners();
        }
    } else if (state.currentTab === 'stopwatch') {
        timeHtml = format(state.stopwatch.seconds);
        label = "Stopwatch";
        settingsArea.innerHTML = '';
    } else {
        timeHtml = new Date().toLocaleTimeString('en-GB').replace(/:/g, '<span class="colon">:</span>');
        label = "Current Time";
        settingsArea.innerHTML = '';
    }

    // Dynamic Font Scaling
    const plainText = timeHtml.replace(/<[^>]*>?/gm, '');
    const hasHours = plainText.length > 5;
    mainDisplay.style.fontSize = hasHours ? "min(16vw, 140px)" : "min(18vw, 160px)";

    mainDisplay.innerHTML = timeHtml;
    modeLabel.textContent = label;
    mainToggle.textContent = state.isRunning ? "Pause" : "Start";

    if (state.fullscreen) {
        const fsDisplay = document.getElementById('fs-display');
        fsDisplay.style.fontSize = hasHours ? "24vw" : "28vw";
        fsDisplay.innerHTML = timeHtml;
        document.getElementById('fs-label').textContent = label;
    }
}

function attachInputListeners() {
    const fInput = document.getElementById('p-focus');
    const bInput = document.getElementById('p-break');

    fInput.addEventListener('input', (e) => {
        state.pomodoro.focus = parseInt(e.target.value) || 0;
        if (!state.isRunning && state.pomodoro.isFocus) {
            state.pomodoro.remaining = state.pomodoro.focus * 60;
            updateUI();
        }
    });

    bInput.addEventListener('input', (e) => {
        state.pomodoro.break = parseInt(e.target.value) || 0;
        if (!state.isRunning && !state.pomodoro.isFocus) {
            state.pomodoro.remaining = state.pomodoro.break * 60;
            updateUI();
        }
    });
}

function toggle() {
    if (state.isRunning) {
        clearInterval(state.intervals.main);
        state.isRunning = false;
    } else {
        state.isRunning = true;
        state.intervals.main = setInterval(() => {
            if (state.currentTab === 'pomodoro') {
                state.pomodoro.remaining--;
                if (state.pomodoro.remaining <= 0) {
                    state.pomodoro.isFocus = !state.pomodoro.isFocus;
                    state.pomodoro.remaining = (state.pomodoro.isFocus ? state.pomodoro.focus : state.pomodoro.break) * 60;
                }
            } else if (state.currentTab === 'stopwatch') {
                state.stopwatch.seconds++;
            }
            updateUI();
        }, 1000);
    }
    updateUI();
}

function reset() {
    clearInterval(state.intervals.main);
    state.isRunning = false;
    if (state.currentTab === 'pomodoro') {
        state.pomodoro.isFocus = true;
        state.pomodoro.remaining = state.pomodoro.focus * 60;
    }
    if (state.currentTab === 'stopwatch') state.stopwatch.seconds = 0;
    updateUI();
}

// Fullscreen Logic
async function toggleFS() {
    const ov = document.getElementById('fullscreen-overlay');
    state.fullscreen = !state.fullscreen;
    
    if (state.fullscreen) {
        ov.classList.remove('hidden');
        try {
            if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
            if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape').catch(() => {});
        } catch (e) { console.log(e); }
    } else {
        ov.classList.add('hidden');
        if (document.fullscreenElement) {
            if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
            document.exitFullscreen();
        }
    }
    updateUI();
}

// Event Listeners
document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

mainToggle.addEventListener('click', toggle);
document.getElementById('main-reset').addEventListener('click', reset);
document.getElementById('main-fullscreen').addEventListener('click', toggleFS);
mainDisplay.addEventListener('click', toggle);
document.getElementById('fs-display').addEventListener('click', toggle);

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    if (e.key.toLowerCase() === 'r') reset();
    if (e.key.toLowerCase() === 'f') toggleFS();
});

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        state.fullscreen = false;
        document.getElementById('fullscreen-overlay').classList.add('hidden');
        updateUI();
    }
});

setInterval(() => {
    document.getElementById('clock').textContent = new Date().toLocaleTimeString();
    if (state.currentTab === 'clock') updateUI();
}, 1000);

updateUI();