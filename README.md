# Simple Timer

A clean, customizable countdown timer that runs entirely in the browser. No frameworks, no dependencies — just HTML, CSS, and vanilla JavaScript.

## ✨ Features

- ⏱ **Custom duration** — set hours, minutes, and seconds independently
- ▶️ **Start / Pause / Reset** controls
- 🎨 **6 built-in themes**
  - 🌑 Dark (default)
  - ☀️ Light
  - 🌸 Light Pink
  - 💧 Light Blue
  - 🍷 Dark Pink
  - 🌌 Dark Blue
- 🖌 **Full custom colors** — pick your own background, text, and accent colors
- 🔔 **Audio + visual alert** when the timer hits zero
- 💾 **Settings persistence** — your theme and custom colors are saved with `localStorage`
- 📱 **Responsive** — works on mobile and desktop

## 🚀 Usage

Just open `index.html` in any modern browser.

```bash
open index.html
```

Or serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## 🛠 How it works

| File | Purpose |
|------|---------|
| `index.html` | Markup for the timer, inputs, controls, and settings panel |
| `style.css` | Theme variables (CSS custom properties) and layout |
| `script.js` | Timer logic, theme switching, and persistence |

### Themes

Themes are implemented with CSS variables on `[data-theme="..."]` selectors. Switching themes is just `document.documentElement.setAttribute('data-theme', name)`. Custom color picks override these via inline CSS variables.

### Timer accuracy

The countdown uses a wall-clock `endTimestamp` rather than naive integer subtraction, so it stays accurate even if the browser tab is throttled in the background.

## ⌨️ Keyboard shortcuts

- **Enter** (while focused on a time input) → Set
- **Esc** → Close the settings panel

## 📄 License

MIT