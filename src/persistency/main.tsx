import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "../index.css";
import { applyTheme, readStoredTheme } from "../lib/theme";

const stored = readStoredTheme();
const prefersDark =
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
const initial = stored ?? (prefersDark ? "dark" : "light");
applyTheme(initial);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
