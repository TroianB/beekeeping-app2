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

window.addEventListener("bk:quick-apiary-added", () => {
  appVersion += 1;
  renderApp();
});

renderApp();
