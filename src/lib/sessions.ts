import type { ShareableState } from "../types";

const SESSIONS_KEY = "uptake-sessions";
const AUTO_SAVE_KEY = "uptake-state";

export interface SavedSession {
  name: string;
  timestamp: number;
  state: ShareableState;
}

// --- Auto-save (cross-navigation persistence) ---

export function autoSaveState(state: ShareableState): void {
  try {
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function loadAutoSavedState(): ShareableState | null {
  try {
    const raw = localStorage.getItem(AUTO_SAVE_KEY);
    return raw ? JSON.parse(raw) as ShareableState : null;
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

export function saveSession(name: string, state: ShareableState): void {
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
