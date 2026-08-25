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
import "./apiary-list-screen-text.css";
import "./apiary-edit-screen-text.css";
import "./apiary-list-compact-top.css";
import "./apiary-region-area.css";
import "./apiary-region-filter.css";
import "./apiary-region-edit.css";
import "./apiary-quick-add.css";
import "./theme.js";
import "./csv-controls.js";
import "./apiary-mobile.js";
import "./apiary-list-only.js";
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

window.addEventListener("bk:quick-apiary-added", () => {
  try {
    sessionStorage.setItem("bk.returnToApiariesAfterQuickAdd", "1");
  } catch {}

  appVersion += 1;
  renderApp();

  [0, 25, 100, 250, 500].forEach((delay) => {
    window.setTimeout(forceApiariesTab, delay);
  });
});

// Keep the user on the Apiaries page after deleting one or more selected apiaries.
document.addEventListener("click", (event) => {
  const button = event.target.closest?.("button");
  if (!button) return;

  const search = document.querySelector('#root input[placeholder="Search apiaries..."]');
  if (!search) return;

  const text = button.textContent.trim().toLowerCase();
  if (!(text === "delete" || text === "delete apiary" || text === "delete apiaries")) return;
  if (text.includes("region")) return;

  const hasSelectedApiary = Array.from(document.querySelectorAll('#root input[type="checkbox"]'))
    .some((checkbox) => checkbox.checked);
  if (!hasSelectedApiary) return;

  [0, 25, 100, 250, 500].forEach((delay) => {
    window.setTimeout(forceApiariesTab, delay);
  });
}, true);

renderApp();
