import type { AppState, ShareableState } from "../types";

const PARAM_NAME = "state";

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

export function toShareableState(state: AppState): ShareableState {
  return {
    activeModel: state.activeModel,
    core: state.core,
    params: state.params,
    editingScenarioId: state.editingScenarioId,
    rightTab: state.rightTab,
    leftTab: state.leftTab,
    chartMode: state.chartMode,
    bassView: state.bassView,
    scenarios: state.scenarios,
    theme: state.theme
  };
}

export function encodeShareState(state: ShareableState): string {
  return toBase64Utf8(JSON.stringify(state));
}

export function decodeShareState(encoded: string): ShareableState | null {
  try {
    const json = fromBase64Utf8(encoded);
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const candidate = parsed as Partial<ShareableState>;
    return {
      ...candidate,
      editingScenarioId: candidate.editingScenarioId ?? null
    } as ShareableState;
  } catch {
    return null;
  }
}

export function readShareStateFromUrl(): ShareableState | null {
  if (typeof window === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get(PARAM_NAME);
  return encoded ? decodeShareState(encoded) : null;
}

export function writeShareStateToUrl(state: ShareableState): string {
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM_NAME, encodeShareState(state));
  window.history.replaceState({}, "", url.toString());
  return url.toString();
}
