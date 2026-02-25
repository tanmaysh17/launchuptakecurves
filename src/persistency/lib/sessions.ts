import type { ShareablePersistencyState } from "../types";

const SESSIONS_KEY = "persistency-sessions";
const AUTO_SAVE_KEY = "persistency-state";

export interface SavedSession {
  name: string;
  timestamp: number;
  state: ShareablePersistencyState;
}

// --- Auto-save (cross-navigation persistence) ---

export function autoSaveState(state: ShareablePersistencyState): void {
  try {
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function loadAutoSavedState(): ShareablePersistencyState | null {
  try {
    const raw = localStorage.getItem(AUTO_SAVE_KEY);
    return raw ? JSON.parse(raw) as ShareablePersistencyState : null;
  } catch {
    return null;
  }
}

// --- Named sessions ---

export function listSessions(): SavedSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSession(name: string, state: ShareablePersistencyState): void {
  const sessions = listSessions();
  const existing = sessions.findIndex((s) => s.name === name);
  const entry: SavedSession = { name, timestamp: Date.now(), state };
  if (existing >= 0) {
    sessions[existing] = entry;
  } else {
    sessions.push(entry);
  }
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch { /* ignore */ }
}

export function loadSession(name: string): SavedSession | null {
  return listSessions().find((s) => s.name === name) ?? null;
}

export function deleteSession(name: string): void {
  const sessions = listSessions().filter((s) => s.name !== name);
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch { /* ignore */ }
}

// --- URL sharing ---

function toBase64Utf8(value: string): string {
  return btoa(encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, p1: string) => String.fromCharCode(Number.parseInt(p1, 16))));
}

function fromBase64Utf8(value: string): string {
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(value), (c: string) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join("")
  );
}

export function encodeShareState(state: ShareablePersistencyState): string {
  return toBase64Utf8(JSON.stringify(state));
}

export function decodeShareState(encoded: string): ShareablePersistencyState | null {
  try {
    const json = fromBase64Utf8(encoded);
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as ShareablePersistencyState;
  } catch {
    return null;
  }
}

export function readShareStateFromUrl(): ShareablePersistencyState | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("state");
  return encoded ? decodeShareState(encoded) : null;
}

export function writeShareStateToUrl(state: ShareablePersistencyState): string {
  const url = new URL(window.location.href);
  url.searchParams.set("state", encodeShareState(state));
  window.history.replaceState({}, "", url.toString());
  return url.toString();
}
