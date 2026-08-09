import "./app2-storage.js";
import React from "react";
import { createRoot } from "react-dom/client";
import BeekeepingApp from "./App.jsx";
import "./fit-screen.css";
import "./apiary-labels.css";
import "./theme.js";
import "./csv-controls.js";
import "./apiary-mobile.js";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BeekeepingApp />
  </React.StrictMode>
);
