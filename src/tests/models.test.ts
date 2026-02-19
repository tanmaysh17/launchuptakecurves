import { describe, expect, it } from "vitest";
import { computeSeries, DEFAULT_PARAMS, richardsInflectionPctOfCeiling } from "../lib/models";

describe("model formulas", () => {
  it("computes logistic curve within bounds", () => {
    const series = computeSeries({
      model: "logistic",
      core: { ceilingPct: 100, horizon: 40, launchLag: 0, timeUnit: "months", tam: null },
      params: DEFAULT_PARAMS
    });
    expect(series.cumulativePct[0]).toBeGreaterThanOrEqual(0);
    expect(series.cumulativePct.at(-1)).toBeLessThanOrEqual(100);
  });

  it("richards with nu=1 approximates logistic", () => {
    const params = {
      ...DEFAULT_PARAMS,
      richards: { ...DEFAULT_PARAMS.richards, k: 0.3, t0: 18, nu: 1 },
      logistic: { ...DEFAULT_PARAMS.logistic, k: 0.3, t0: 18 }
    };
    const richards = computeSeries({
      model: "richards",
      core: { ceilingPct: 100, horizon: 50, launchLag: 0, timeUnit: "months", tam: null },
      params
    });
    const logistic = computeSeries({
      model: "logistic",
      core: { ceilingPct: 100, horizon: 50, launchLag: 0, timeUnit: "months", tam: null },
      params
    });
    for (let i = 0; i < richards.cumulativePct.length; i += 1) {
      expect(Math.abs(richards.cumulativePct[i] - logistic.cumulativePct[i])).toBeLessThan(1e-6);
    }
  });

  it("richards near-zero nu tracks gompertz", () => {
    const params = {
      ...DEFAULT_PARAMS,
      richards: { ...DEFAULT_PARAMS.richards, k: 0.28, t0: 16, nu: 1e-5 },
      gompertz: { ...DEFAULT_PARAMS.gompertz, k: 0.28, t0: 16 }
    };
    const richards = computeSeries({
      model: "richards",
      core: { ceilingPct: 90, horizon: 40, launchLag: 0, timeUnit: "months", tam: null },
      params
    });
    const gompertz = computeSeries({
      model: "gompertz",
      core: { ceilingPct: 90, horizon: 40, launchLag: 0, timeUnit: "months", tam: null },
      params
    });
    for (let i = 0; i < richards.cumulativePct.length; i += 1) {
      expect(Math.abs(richards.cumulativePct[i] - gompertz.cumulativePct[i])).toBeLessThan(1e-6);
    }
  });

  it("bass cumulative is monotonic with non-negative incrementals", () => {
    const series = computeSeries({
      model: "bass",
      core: { ceilingPct: 100, horizon: 60, launchLag: 0, timeUnit: "months", tam: null },
      params: {
        ...DEFAULT_PARAMS,
        bass: { p: 0.03, q: 0.38 }
      }
    });
    for (let i = 1; i < series.cumulativePct.length; i += 1) {
      expect(series.cumulativePct[i]).toBeGreaterThanOrEqual(series.cumulativePct[i - 1]);
      expect(series.incrementalPct[i]).toBeGreaterThanOrEqual(0);
    }
  });

  it("richards inflection helper returns plausible percentage", () => {
    const value = richardsInflectionPctOfCeiling(1);
    expect(value).toBeCloseTo(50, 5);
  });
});
