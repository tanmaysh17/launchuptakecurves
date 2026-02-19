import type { ThemeMode } from "../types";

const STORAGE_KEY = "launch-uptake-theme";

const THEME_VARS: Record<ThemeMode, Record<string, string>> = {
  dark: {
    "--app-bg": "13 17 23",
    "--app-surface": "22 27 34",
    "--app-elevated": "26 35 50",
    "--app-accent": "0 212 180",
    "--app-amber": "240 165 0",
    "--app-purple": "167 139 250",
    "--app-text": "230 237 243",
    "--app-muted": "139 148 158",
    "--app-border": "48 54 61",
    "--app-success": "63 185 80"
  },
  light: {
    "--app-bg": "248 250 253",
    "--app-surface": "255 255 255",
    "--app-elevated": "238 245 252",
    "--app-accent": "0 154 214",
    "--app-amber": "226 144 0",
    "--app-purple": "116 104 244",
    "--app-text": "20 27 35",
    "--app-muted": "94 106 119",
    "--app-border": "205 215 227",
    "--app-success": "31 143 65"
  }
};

export function themeVars(theme: ThemeMode): Record<string, string> {
  return THEME_VARS[theme === "light" ? "light" : "dark"];
}

export function readStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "light" || raw === "dark" ? raw : null;
  } catch {
    return null;
  }
}

export function persistTheme(theme: ThemeMode): void {
  const safeTheme: ThemeMode = theme === "light" ? "light" : "dark";
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, safeTheme);
  } catch {
    // Ignore storage failures in restricted browser contexts.
  }
}

export function applyTheme(theme: ThemeMode): void {
  const safeTheme: ThemeMode = theme === "light" ? "light" : "dark";
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  const body = document.body;
  root.setAttribute("data-theme", safeTheme);
  root.classList.toggle("theme-light", safeTheme === "light");
  root.classList.toggle("theme-dark", safeTheme === "dark");
  if (body) {
    body.setAttribute("data-theme", safeTheme);
    body.classList.toggle("theme-light", safeTheme === "light");
    body.classList.toggle("theme-dark", safeTheme === "dark");
  }
  const vars = themeVars(safeTheme);
  Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value));
}
