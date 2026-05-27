/* ===== Simple Timer ===== */

(() => {
  // ----- DOM -----
  const display = document.getElementById('timer-display');
  const inputH = document.getElementById('input-hours');
  const inputM = document.getElementById('input-minutes');
  const inputS = document.getElementById('input-seconds');
  const btnSet = document.getElementById('btn-set');
  const btnStart = document.getElementById('btn-start');
  const btnPause = document.getElementById('btn-pause');
  const btnReset = document.getElementById('btn-reset');

  const settingsToggle = document.getElementById('settings-toggle');
  const settingsClose = document.getElementById('settings-close');
  const settingsPanel = document.getElementById('settings-panel');
  const settingsOverlay = document.getElementById('settings-overlay');

  const themeButtons = document.querySelectorAll('.theme-btn');
  const colorBg = document.getElementById('color-bg');
  const colorText = document.getElementById('color-text');
  const colorAccent = document.getElementById('color-accent');
  const btnResetTheme = document.getElementById('btn-reset-theme');

  // ----- State -----
  const STORAGE_KEY = 'simple-timer-settings';
  const DEFAULT_THEME = 'dark';

  let totalSeconds = 0;       // Currently configured time (seconds)
  let remainingSeconds = 0;   // Remaining time
  let intervalId = null;
  let endTimestamp = null;    // Wall-clock time when the timer should hit 0

  // ----- Utilities -----
  const pad = (n) => String(n).padStart(2, '0');

  const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const updateDisplay = () => {
    display.textContent = formatTime(remainingSeconds);
    document.title = remainingSeconds > 0
      ? `${formatTime(remainingSeconds)} - Simple Timer`
      : 'Simple Timer';
  };

  // ----- Timer logic -----
  const startTimer = () => {
    if (intervalId) return; // already running

    if (remainingSeconds <= 0) {
      // Pull from inputs if no remaining time
      applyInputsToTotal();
      remainingSeconds = totalSeconds;
      if (remainingSeconds <= 0) return;
    }

    endTimestamp = Date.now() + remainingSeconds * 1000;
    display.classList.remove('finished');

    intervalId = setInterval(() => {
      const msLeft = endTimestamp - Date.now();
      remainingSeconds = Math.max(0, Math.ceil(msLeft / 1000));
      updateDisplay();
      if (remainingSeconds <= 0) {
        finishTimer();
      }
    }, 200);
  };

  const pauseTimer = () => {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
    // Recompute remaining from endTimestamp for accuracy
    if (endTimestamp) {
      remainingSeconds = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
    }
    updateDisplay();
  };

  const resetTimer = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    remainingSeconds = totalSeconds;
    display.classList.remove('finished');
    updateDisplay();
  };

  const finishTimer = () => {
    clearInterval(intervalId);
    intervalId = null;
    remainingSeconds = 0;
    updateDisplay();
    display.classList.add('finished');
    playAlarm();
  };

  const applyInputsToTotal = () => {
    const h = clamp(parseInt(inputH.value, 10) || 0, 0, 99);
    const m = clamp(parseInt(inputM.value, 10) || 0, 0, 59);
    const s = clamp(parseInt(inputS.value, 10) || 0, 0, 59);
    inputH.value = h;
    inputM.value = m;
    inputS.value = s;
    totalSeconds = h * 3600 + m * 60 + s;
  };

  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  const setTimerFromInputs = () => {
    pauseTimer();
    applyInputsToTotal();
    remainingSeconds = totalSeconds;
    display.classList.remove('finished');
    updateDisplay();
  };

  // ----- Alarm sound (Web Audio beep) -----
  const playAlarm = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.value = 0.15;
        osc.connect(gain).connect(ctx.destination);
        const start = ctx.currentTime + delay;
        osc.start(start);
        osc.stop(start + 0.3);
      };
      [0, 0.5, 1.0, 1.5, 2.0].forEach(playBeep);
      setTimeout(() => ctx.close(), 3000);
    } catch (e) {
      // Audio not available — silent fail
    }
  };

  // ----- Settings panel -----
  const openSettings = () => {
    settingsPanel.classList.add('open');
    settingsOverlay.classList.add('open');
    settingsPanel.setAttribute('aria-hidden', 'false');
  };

  const closeSettings = () => {
    settingsPanel.classList.remove('open');
    settingsOverlay.classList.remove('open');
    settingsPanel.setAttribute('aria-hidden', 'true');
  };

  // ----- Theme handling -----
  const THEME_DEFAULTS = {
    dark:        { bg: '#1a1a1a', text: '#ffffff', accent: '#ffffff' },
    light:       { bg: '#f5f5f5', text: '#222222', accent: '#222222' },
    'light-pink':{ bg: '#ffe4ec', text: '#5a2a3d', accent: '#d63384' },
    'light-blue':{ bg: '#e3f2fd', text: '#0d3b66', accent: '#1976d2' },
    'dark-pink': { bg: '#2b1620', text: '#ffd6e4', accent: '#ff6fa3' },
    'dark-blue': { bg: '#0d1b2a', text: '#e0e8f0', accent: '#4ea8ff' },
  };

  const applyTheme = (theme, customColors = null) => {
    // Apply preset via data-theme attribute
    document.documentElement.setAttribute('data-theme', theme);

    // If custom overrides exist, apply them as inline CSS variables
    if (customColors) {
      const { bg, text, accent } = customColors;
      if (bg) document.documentElement.style.setProperty('--bg', bg);
      if (text) document.documentElement.style.setProperty('--text', text);
      if (accent) {
        document.documentElement.style.setProperty('--accent', accent);
        document.documentElement.style.setProperty('--accent-text', getReadableTextColor(accent));
      }
    } else {
      // Clear inline overrides so the data-theme rules take effect
      document.documentElement.style.removeProperty('--bg');
      document.documentElement.style.removeProperty('--text');
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--accent-text');
    }

    // Update active state on theme buttons
    themeButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.theme === theme && !customColors);
    });

    // Sync color pickers to current effective colors
    syncColorPickers();
  };

  const syncColorPickers = () => {
    const styles = getComputedStyle(document.documentElement);
    const bg = rgbToHex(styles.getPropertyValue('--bg').trim());
    const text = rgbToHex(styles.getPropertyValue('--text').trim());
    const accent = rgbToHex(styles.getPropertyValue('--accent').trim());
    if (bg) colorBg.value = bg;
    if (text) colorText.value = text;
    if (accent) colorAccent.value = accent;
  };

  const rgbToHex = (color) => {
    if (!color) return null;
    if (color.startsWith('#')) return color;
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    return '#' + [m[1], m[2], m[3]]
      .map((n) => parseInt(n, 10).toString(16).padStart(2, '0'))
      .join('');
  };

  const getReadableTextColor = (hex) => {
    // Determine readable text color for a given background
    const c = hex.replace('#', '');
    if (c.length !== 6) return '#000000';
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#1a1a1a' : '#ffffff';
  };

  // ----- Persistence -----
  const saveSettings = () => {
    const data = {
      theme: document.documentElement.getAttribute('data-theme') || DEFAULT_THEME,
      custom: getCustomOverrides(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const getCustomOverrides = () => {
    const inline = document.documentElement.style;
    const bg = inline.getPropertyValue('--bg');
    const text = inline.getPropertyValue('--text');
    const accent = inline.getPropertyValue('--accent');
    if (!bg && !text && !accent) return null;
    return { bg, text, accent };
  };

  const loadSettings = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        applyTheme(DEFAULT_THEME);
        return;
      }
      const data = JSON.parse(raw);
      applyTheme(data.theme || DEFAULT_THEME, data.custom || null);
    } catch (e) {
      applyTheme(DEFAULT_THEME);
    }
  };

  // ----- Event listeners -----
  btnStart.addEventListener('click', startTimer);
  btnPause.addEventListener('click', pauseTimer);
  btnReset.addEventListener('click', resetTimer);
  btnSet.addEventListener('click', setTimerFromInputs);

  [inputH, inputM, inputS].forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') setTimerFromInputs();
    });
  });

  settingsToggle.addEventListener('click', openSettings);
  settingsClose.addEventListener('click', closeSettings);
  settingsOverlay.addEventListener('click', closeSettings);

  themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.theme);
      saveSettings();
    });
  });

  const handleColorChange = () => {
    applyTheme(document.documentElement.getAttribute('data-theme') || DEFAULT_THEME, {
      bg: colorBg.value,
      text: colorText.value,
      accent: colorAccent.value,
    });
    // Re-mark all theme buttons inactive when custom colors are in use
    themeButtons.forEach((b) => b.classList.remove('active'));
    saveSettings();
  };

  colorBg.addEventListener('input', handleColorChange);
  colorText.addEventListener('input', handleColorChange);
  colorAccent.addEventListener('input', handleColorChange);

  btnResetTheme.addEventListener('click', () => {
    applyTheme(DEFAULT_THEME);
    saveSettings();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsPanel.classList.contains('open')) {
      closeSettings();
    }
  });

  // ----- Init -----
  loadSettings();
  updateDisplay();
})();