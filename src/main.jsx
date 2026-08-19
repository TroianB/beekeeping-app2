import "./app2-storage.js";
import React from "react";
import { createRoot } from "react-dom/client";
import MonitoringShell from "./MonitoringShell.jsx";
import "./fit-screen.css";
import "./apiary-column-order.css";
import "./apiary-list-only.css";
import "./theme.js";
import "./csv-controls.js";
import "./apiary-mobile.js";
import "./apiary-list-only.js";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MonitoringShell />
  </React.StrictMode>
);
