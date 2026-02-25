import { useState } from "react";
import type { ShareablePersistencyState } from "../types";
import { listSessions, saveSession, deleteSession, writeShareStateToUrl, type SavedSession } from "../lib/sessions";

interface SessionManagerProps {
  state: ShareablePersistencyState;
  onLoadSession: (session: ShareablePersistencyState) => void;
  onToast: (msg: string) => void;
}

export function SessionManager({ state, onLoadSession, onToast }: SessionManagerProps) {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [saveName, setSaveName] = useState("");

  const refresh = () => setSessions(listSessions());

  const handleOpen = () => {
    refresh();
    setOpen(true);
  };

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;
    saveSession(name, state);
    setSaveName("");
    refresh();
    onToast(`Session "${name}" saved.`);
  };

  const handleLoad = (s: SavedSession) => {
    onLoadSession(s.state);
    setOpen(false);
    onToast(`Session "${s.name}" loaded.`);
  };

  const handleDelete = (name: string) => {
    deleteSession(name);
    refresh();
  };

  const handleShare = async () => {
    const url = writeShareStateToUrl(state);
    try {
      await navigator.clipboard.writeText(url);
      onToast("Share URL copied to clipboard.");
    } catch {
      onToast("Share URL written to address bar.");
    }
  };

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleShare}
          className="rounded border border-app-border px-3 py-1.5 font-chrome text-[11px] uppercase tracking-[0.08em] text-app-text hover:border-app-accent hover:text-app-accent"
        >
          Share
        </button>
        <button
          onClick={handleOpen}
          className="rounded border border-app-border px-3 py-1.5 font-chrome text-[11px] uppercase tracking-[0.08em] text-app-text hover:border-app-accent hover:text-app-accent"
        >
          Sessions
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-panel border border-app-border bg-app-surface p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-chrome text-sm uppercase tracking-[0.1em] text-app-text">Saved Sessions</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-app-muted hover:text-app-text text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Save new session */}
          <div className="flex gap-2 mb-4">
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Session name…"
              className="flex-1 rounded border border-app-border bg-app-bg px-3 py-1.5 font-mono text-xs text-app-text placeholder:text-app-muted outline-none focus:border-app-accent"
            />
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="rounded border border-app-accent bg-[rgb(var(--app-accent)/0.12)] px-3 py-1.5 font-chrome text-[11px] uppercase tracking-[0.08em] text-app-accent disabled:opacity-40"
            >
              Save
            </button>
          </div>

          {/* Session list */}
          {sessions.length === 0 ? (
            <p className="text-xs text-app-muted text-center py-4">No saved sessions yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sessions
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between rounded border border-app-border bg-app-bg px-3 py-2"
                  >
                    <div>
                      <div className="font-chrome text-xs text-app-text">{s.name}</div>
                      <div className="text-[10px] text-app-muted">
                        {new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoad(s)}
                        className="rounded border border-app-accent px-2 py-0.5 font-chrome text-[10px] uppercase tracking-[0.08em] text-app-accent hover:bg-[rgb(var(--app-accent)/0.12)]"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDelete(s.name)}
                        className="rounded border border-app-border px-1.5 py-0.5 font-chrome text-[10px] text-app-muted hover:border-red-400 hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Share button */}
          <div className="mt-4 pt-3 border-t border-app-border">
            <button
              onClick={handleShare}
              className="w-full rounded border border-app-accent bg-[rgb(var(--app-accent)/0.12)] px-3 py-2 font-chrome text-[11px] uppercase tracking-[0.08em] text-app-accent hover:bg-[rgb(var(--app-accent)/0.18)]"
            >
              Copy Share URL
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
