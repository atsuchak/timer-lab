const state = {
    currentTab: 'pomodoro',
    isRunning: false,
    fullscreen: false,
    pomodoro: {
        focus: 25,
        break: 5,
        remaining: 25 * 60,
        isFocus: true,
        autoRepeat: false,
        isFinished: false
    },
    stopwatch: { seconds: 0 },
    clockFormat12h: false, // NEW: Defaults to 24h format
    intervals: { main: null }
};

const mainDisplay = document.getElementById('main-display');
const mainToggle = document.getElementById('main-toggle');
const modeLabel = document.getElementById('mode-label');
const settingsArea = document.getElementById('settings-area');

let alarmInterval = null;

function playPremiumAlarm() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let count = 0;

    if (alarmInterval) clearInterval(alarmInterval);

    alarmInterval = setInterval(() => {
        const now = ctx.currentTime;
        
        playNote(880, now, ctx);

        count++;
        if (count >= 5) {
            clearInterval(alarmInterval);
            alarmInterval = null;
        }
    }, 1000); 
}

function reset() {
    clearInterval(state.intervals.main);

    if (alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = null;
    }

    state.isRunning = false;
    state.pomodoro.isFinished = false; 

    if (state.currentTab === 'pomodoro') {
        state.pomodoro.isFocus = true;
        state.pomodoro.remaining = state.pomodoro.focus * 60;
    }

    if (state.currentTab === 'stopwatch') {
        state.stopwatch.seconds = 0;
    }

    updateUI();
}

function format(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (num) => String(num).padStart(2, '0');

    const wrapDigits = (numStr) => {
        return numStr.split('').map(digit => `<span class="digit">${digit}</span>`).join('');
    };

    const hPart = h > 0 ? `<span class="time-block">${wrapDigits(pad(h))}</span><span class="colon">:</span>` : "";
    const mPart = `<span class="time-block">${wrapDigits(pad(m))}</span>`;
    const sPart = `<span class="colon">:</span><span class="time-block">${wrapDigits(pad(s))}</span>`;

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

    const startBtn = document.getElementById('main-toggle');
    const resetBtn = document.getElementById('main-reset');

    if (tab === 'clock') {
        startBtn.classList.add('hidden');
        resetBtn.classList.add('hidden');
    } else {
        startBtn.classList.remove('hidden');
        resetBtn.classList.remove('hidden');
    }

    settingsArea.innerHTML = '';
    updateUI();
}

function updateUI() {
    let label = "";
    let timeHtml = "";
    let statusClass = "";

    if (state.currentTab === 'pomodoro') {
        timeHtml = format(state.pomodoro.remaining);
        label = state.pomodoro.isFocus ? "Focus Session" : "Break Time";

        if (state.pomodoro.isFinished) {
            statusClass = "timer-finished";
        } else if (!state.isRunning && state.pomodoro.remaining < (state.pomodoro.isFocus ? state.pomodoro.focus : state.pomodoro.break) * 60) {
            statusClass = "timer-paused";
        } else {
            statusClass = state.pomodoro.isFocus ? "timer-focus" : "timer-break";
        }

        if (settingsArea.innerHTML.trim() === '') {
            settingsArea.innerHTML = `
                <div class="flex flex-col items-center gap-4">
                    <div class="flex gap-6">
                        <div class="flex flex-col items-center gap-2">
                            <span class="text-[9px] uppercase text-gray-600 tracking-widest font-bold">Focus</span>
                            <input type="number" id="p-focus" value="${state.pomodoro.focus}" class="w-16 bg-transparent border-b border-[#2a2a2a] text-[#00d4ff] font-timer text-center outline-none focus:border-[#00d4ff] transition-all">
                        </div>
                        <div class="flex flex-col items-center gap-2">
                            <span class="text-[9px] uppercase text-gray-600 tracking-widest font-bold">Break</span>
                            <input type="number" id="p-break" value="${state.pomodoro.break}" class="w-16 bg-transparent border-b border-[#2a2a2a] text-[#00ff88] font-timer text-center outline-none focus:border-[#00ff88] transition-all">
                        </div>
                    </div>
                    <label class="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" id="p-repeat" ${state.pomodoro.autoRepeat ? 'checked' : ''} class="w-3 h-3 accent-[#00d4ff] cursor-pointer">
                        <span class="text-[10px] uppercase text-gray-500 tracking-[0.2em] group-hover:text-gray-300 transition-colors">Auto Repeat</span>
                    </label>
                </div>
            `;
            attachInputListeners();
        }
    } else if (state.currentTab === 'stopwatch') {
        timeHtml = format(state.stopwatch.seconds);
        label = "Stopwatch";
        settingsArea.innerHTML = '';

        if (!state.isRunning && state.stopwatch.seconds > 0) {
            statusClass = "timer-paused";
        } else {
            statusClass = "timer-focus"; 
        }

    } else {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        const s = now.getSeconds();

        if (state.clockFormat12h) {
            const period = h >= 12 ? 'PM' : 'AM';
            const displayH = h % 12 || 12;

            const ampmSize = state.fullscreen ? "3vw" : "0.85rem";
            const ampmRight = state.fullscreen ? "-4.5vw" : "-2.3rem";
            const ampmTop = state.fullscreen ? "1vw" : "-0.4rem";

            timeHtml = `
                <div class="relative flex items-center justify-center">
                    ${format(displayH * 3600 + m * 60 + s)}
                    <span class="absolute font-bold text-[#00d4ff] opacity-40 tracking-widest"
                          style="font-size: ${ampmSize}; right: ${ampmRight}; top: ${ampmTop};">
                        ${period}
                    </span>
                </div>`;
        } else {
            timeHtml = format(h * 3600 + m * 60 + s);
        }

        label = "Current Time";
        statusClass = "timer-focus";

        if (settingsArea.innerHTML.trim() === '') {
            settingsArea.innerHTML = `
                <div class="flex flex-col items-center gap-4">
                    <label class="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" id="c-format" ${state.clockFormat12h ? 'checked' : ''} class="w-3 h-3 accent-[#00d4ff] cursor-pointer">
                        <span class="text-[10px] uppercase text-gray-500 tracking-[0.2em] group-hover:text-gray-200 transition-colors">Use 12h Format</span>
                    </label>
                </div>
            `;
            attachInputListeners();
        }
    }

    const plainText = timeHtml.replace(/<[^>]*>?/gm, '');
    const hasHours = plainText.length > 5;
    mainDisplay.style.fontSize = hasHours ? "min(14vw, 120px)" : "min(18vw, 160px)";

    mainDisplay.className = `font-timer font-bold leading-none mb-10 transition-all duration-300 ${statusClass}`;
    mainDisplay.innerHTML = timeHtml;
    modeLabel.textContent = label;
    mainToggle.textContent = state.isRunning ? "Pause" : "Start";

    if (state.fullscreen) {
        const fsDisplay = document.getElementById('fs-display');
        const fsLabel = document.getElementById('fs-label');

        fsDisplay.className = `font-timer font-bold leading-none transition-all duration-300 ${statusClass}`;

        fsDisplay.style.fontSize = hasHours ? "16vw" : "24vw";
        fsDisplay.innerHTML = timeHtml;
        fsLabel.textContent = label;
    }
}

function attachInputListeners() {
    const fInput = document.getElementById('p-focus');
    const bInput = document.getElementById('p-break');
    const rInput = document.getElementById('p-repeat');
    const cInput = document.getElementById('c-format'); // NEW: Clock checkbox

    if (fInput) {
        fInput.addEventListener('input', (e) => {
            state.pomodoro.focus = parseInt(e.target.value) || 0;
            if (!state.isRunning && state.pomodoro.isFocus) {
                state.pomodoro.remaining = state.pomodoro.focus * 60;
                updateUI();
            }
        });
    }

    if (bInput) {
        bInput.addEventListener('input', (e) => {
            state.pomodoro.break = parseInt(e.target.value) || 0;
            if (!state.isRunning && !state.pomodoro.isFocus) {
                state.pomodoro.remaining = state.pomodoro.break * 60;
                updateUI();
            }
        });
    }

    if (rInput) {
        rInput.addEventListener('change', (e) => {
            state.pomodoro.autoRepeat = e.target.checked;
        });
    }

    if (cInput) {
        cInput.addEventListener('change', (e) => {
            state.clockFormat12h = e.target.checked;
            updateUI();
        });
    }
}

// Sound for transitions (Focus <-> Break)
function playBeep(type = 'tung') {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(type === 'tung' ? 880 : 440, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
}

function toggle() {
    if (state.isRunning) {
        clearInterval(state.intervals.main);
        state.isRunning = false;
    } else {
        state.pomodoro.isFinished = false;
        state.isRunning = true;

        state.intervals.main = setInterval(() => {
            if (state.currentTab === 'pomodoro') {
                if (state.pomodoro.remaining <= 0) {
                    if (state.pomodoro.autoRepeat) {
                        playBeep('tung');
                        state.pomodoro.isFocus = !state.pomodoro.isFocus;
                        state.pomodoro.remaining = (state.pomodoro.isFocus ? state.pomodoro.focus : state.pomodoro.break) * 60;
                    } else {
                        state.isRunning = false;
                        state.pomodoro.isFinished = true;
                        state.pomodoro.remaining = 0;
                        clearInterval(state.intervals.main);
                        playPremiumAlarm();
                    }
                } else {
                    state.pomodoro.remaining--;
                }
            } else if (state.currentTab === 'stopwatch') {
                state.stopwatch.seconds++;
            }
            updateUI();
        }, 1000);
    }
    updateUI();
}

// Helper for the alarm notes
function playNote(freq, startTime, ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.4);
}

// Fullscreen Logic
async function toggleFS() {
    const ov = document.getElementById('fullscreen-overlay');
    state.fullscreen = !state.fullscreen;

    if (state.fullscreen) {
        ov.classList.remove('hidden');
        try {
            if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
            if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape').catch(() => { });
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




// /**
//  * TEST UTILITY: Fast Test Button
//  * Delete this entire function and its call when finished.
//  */
// function enableFastTestMode() {
//     // 1. Create the button element
//     const testBtn = document.createElement('button');
//     testBtn.id = "temp-test-btn";
//     testBtn.innerHTML = "TEST 5S";

//     // 2. Style it to float in the corner so it doesn't mess up your UI
//     Object.assign(testBtn.style, {
//         position: 'fixed',
//         bottom: '20px',
//         left: '20px',
//         padding: '10px 15px',
//         background: 'rgba(239, 68, 68, 0.2)',
//         color: '#ef4444',
//         border: '1px solid #ef4444',
//         borderRadius: '8px',
//         fontSize: '10px',
//         fontWeight: 'bold',
//         cursor: 'pointer',
//         zIndex: '9999'
//     });

//     // 3. Add the logic
//     testBtn.onclick = () => {
//         if (state.currentTab === 'pomodoro') {
//             state.pomodoro.remaining = 5;
//             state.pomodoro.isFinished = false;
//             updateUI();
//             console.log("Test Mode: Timer set to 5 seconds");
//         } else {
//             alert("Please switch to Pomodoro tab to test!");
//         }
//     };

//     document.body.appendChild(testBtn);
// }
// enableFastTestMode();




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