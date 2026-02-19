import { describe, expect, it } from "vitest";
import { encodeShareState, decodeShareState, readShareStateFromUrl, writeShareStateToUrl } from "../lib/shareState";
import type { ShareableState } from "../types";

const sample: ShareableState = {
  activeModel: "richards",
  core: {
    ceilingPct: 88,
    horizon: 72,
    timeUnit: "months",
    launchLag: 2,
    outputUnit: "percent",
    tam: null
  },
  params: {
    logistic: { k: 0.3, t0: 18 },
    gompertz: { k: 0.25, t0: 18 },
    richards: { k: 0.3, t0: 18, nu: 1.2 },
    bass: { p: 0.03, q: 0.38 },
    linear: { r: 2.5 }
  },
  editingScenarioId: null,
  rightTab: "chart",
  leftTab: "parameters",
  chartMode: "cumulative",
  bassView: "cumulativeOnly",
  scenarios: [],
  theme: "dark"
};

describe("share state", () => {
  it("encodes and decodes roundtrip", () => {
    const encoded = encodeShareState(sample);
    const decoded = decodeShareState(encoded);
    expect(decoded).toEqual(sample);
  });

  it("writes and reads state from URL", () => {
    writeShareStateToUrl(sample);
    const parsed = readShareStateFromUrl();
    expect(parsed?.activeModel).toBe("richards");
    expect(parsed?.core.ceilingPct).toBe(88);
  });
});
