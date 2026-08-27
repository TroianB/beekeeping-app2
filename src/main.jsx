import "./app2-storage.js";
import React from "react";
import { createRoot } from "react-dom/client";
import MonitoringShell from "./MonitoringShell.jsx";
import "./fit-screen.css";
import "./apiary-column-order.css";
import "./apiary-list-only.css";
import "./apiary-detail-back-arrow.css";
import "./apiary-edit-fix.css";
import "./apiary-edit-saved-highlight.css";
import "./apiary-info-screen.css";
import "./apiary-info-extra.css";
import "./apiary-list-screen-text.css";
import "./apiary-edit-screen-text.css";
import "./apiary-list-compact-top.css";
import "./apiary-region-area.css";
import "./apiary-region-filter.css";
import "./apiary-region-edit.css";
import "./apiary-quick-add.css";
import "./treatment-list-ui.css";
import "./apiary-region-button-match.css";
import "./theme.js";
import "./csv-controls.js";
import "./apiary-mobile.js";
import "./apiary-list-only.js";
import "./apiary-action-row.js";
import "./apiary-delete-no-reload.js";
import "./apiary-detail-back-arrow.js";
import "./apiary-edit-fix.js";
import "./apiary-add-number-cleanup.js";
import "./apiary-edit-cancel-return.js";
import "./apiary-list-metric-dropdown.js";
import "./apiary-list-compact-top.js";
import "./apiary-region-area.js";
import "./apiary-region-filter.js";
import "./apiary-region-edit.js";
import "./apiary-quick-add.js";
import "./apiary-info-extra.js";
import "./apiary-edit-extra.js";
import "./dashboard-apiary-swipe.js";

const root = createRoot(document.getElementById("root"));
let appVersion = 0;

function renderApp() {
  root.render(
    <React.StrictMode>
      <MonitoringShell key={appVersion} />
    </React.StrictMode>
  );
}

function forceApiariesTab() {
  const button = Array.from(document.querySelectorAll("button")).find(
    (item) => item.textContent.trim().toLowerCase() === "apiaries"
  );
  if (!button) return false;
  button.click();
  return true;
}

function remountOnApiaries() {
  try {
    sessionStorage.setItem("bk.returnToApiariesAfterQuickAdd", "1");
  } catch {}

  appVersion += 1;
  renderApp();

  [0, 25, 100, 250, 500].forEach((delay) => {
    window.setTimeout(forceApiariesTab, delay);
  });
}

window.addEventListener("bk:quick-apiary-added", remountOnApiaries);
window.addEventListener("bk:apiaries-deleted", remountOnApiaries);
window.addEventListener("bk:apiary-extra-saved", remountOnApiaries);

renderApp();