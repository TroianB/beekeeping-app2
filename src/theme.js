const THEME_KEY = "bk.theme";

function addThemeStyles() {
  if (document.getElementById("bk-theme-styles")) return;

  const style = document.createElement("style");
  style.id = "bk-theme-styles";
  style.textContent = `
    #themeToggle {
      position: fixed;
      top: 0.75rem;
      right: 0.75rem;
      z-index: 9999;
      width: 2.45rem;
      height: 2.45rem;
      display: grid;
      place-items: center;
      border: 1px solid rgba(250, 204, 21, 0.65);
      border-radius: 999px;
      background: #facc15;
      color: #000000;
      padding: 0;
      font-size: 1.25rem;
      font-weight: 800;
      line-height: 1;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.32);
      cursor: pointer;
    }

    #themeToggle:hover {
      background: #fde047;
      transform: translateY(-1px);
    }

    body.light-mode,
    body.light-mode.bg-neutral-950 {
      background: #f8fafc !important;
      color: #111827 !important;
    }

    body.light-mode #root > div {
      color: #111827 !important;
    }

    body.light-mode .bg-neutral-950 {
      background-color: #f8fafc !important;
    }

    body.light-mode .bg-black\/30,
    body.light-mode .bg-black\/40,
    body.light-mode .bg-black\/50,
    body.light-mode .bg-black\/60 {
      background-color: rgba(255, 255, 255, 0.86) !important;
    }

    body.light-mode [class*="border-yellow-500"] {
      border-color: rgba(202, 138, 4, 0.36) !important;
    }

    body.light-mode [class*="text-yellow-"] {
      color: #3f2a00 !important;
    }

    body.light-mode .text-white {
      color: #111827 !important;
    }

    body.light-mode input,
    body.light-mode textarea,
    body.light-mode select {
      background: #ffffff !important;
      color: #111827 !important;
    }

    body.light-mode input::placeholder,
    body.light-mode textarea::placeholder {
      color: #6b7280 !important;
    }

    /* Keep buttons the same black/yellow colours in Light mode as in Dark mode. */
    body.light-mode #root button,
    body.light-mode #bkImportCsvButton {
      background: rgba(0, 0, 0, 0.4) !important;
      color: #fde047 !important;
      border-color: rgba(250, 204, 21, 0.4) !important;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22) !important;
    }

    body.light-mode #root button:hover,
    body.light-mode #bkImportCsvButton:hover {
      background: rgba(0, 0, 0, 0.6) !important;
      color: #facc15 !important;
    }

    body.light-mode #root input[placeholder="Search apiaries..."] + div > div > div.grid:nth-child(odd) {
      background: rgba(250, 204, 21, 0.15) !important;
    }

    body.light-mode #root input[placeholder="Search apiaries..."] + div > div > div.grid:nth-child(even) {
      background: rgba(255, 255, 255, 0.98) !important;
    }

    body.light-mode #root input[placeholder="Search apiaries..."] + div > div > div.grid:hover {
      background: rgba(250, 204, 21, 0.27) !important;
    }

    body.light-mode #themeToggle {
      background: #facc15;
      color: #000000;
      border-color: rgba(250, 204, 21, 0.65);
    }

    body.light-mode #themeToggle:hover {
      background: #fde047;
    }

    @media (max-width: 640px) {
      #themeToggle {
        top: 0.5rem;
        right: 0.5rem;
        width: 2.25rem;
        height: 2.25rem;
        font-size: 1.1rem;
      }
    }
  `;
  document.head.appendChild(style);
}

function applyTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("light-mode", isLight);
  document.body.classList.toggle("dark-mode", !isLight);

  const button = document.getElementById("themeToggle");
  if (button) {
    button.textContent = isLight ? "☾" : "☀";
    button.title = isLight ? "Switch to dark mode" : "Switch to light mode";
    button.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    button.setAttribute("aria-pressed", String(isLight));
  }
}

function addThemeButton() {
  if (document.getElementById("themeToggle")) return;

  const button = document.createElement("button");
  button.id = "themeToggle";
  button.type = "button";
  document.body.prepend(button);

  button.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("light-mode") ? "dark" : "light";
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
  });
}

addThemeStyles();
addThemeButton();
applyTheme(localStorage.getItem(THEME_KEY) || "dark");
