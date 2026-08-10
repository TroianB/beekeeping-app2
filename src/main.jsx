import "./app2-storage.js";
import React from "react";
import { createRoot } from "react-dom/client";
import MonitoringShell from "./MonitoringShell.jsx";
import "./fit-screen.css";
import "./apiary-column-order.css";
import "./theme.js";
import "./csv-controls.js";
import "./apiary-mobile.js";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MonitoringShell />
  </React.StrictMode>
);
