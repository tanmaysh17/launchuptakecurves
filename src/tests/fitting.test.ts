import { describe, expect, it } from "vitest";
import { computeSeries, DEFAULT_PARAMS } from "../lib/models";
import { createSyntheticState, fitSingleModel } from "../lib/fitting/fitModels";

describe("fitting", () => {
  it("recovers logistic-like synthetic data with strong fit", () => {
    const synthetic = computeSeries({
      model: "logistic",
      core: { ceilingPct: 92, horizon: 50, launchLag: 3, timeUnit: "months", tam: null, timeToPeak: null },
      params: {
        ...DEFAULT_PARAMS,
        logistic: { k: 0.28, t0: 0.34 }
      }
    });
    const observed = synthetic.points
      .filter((p) => p.period <= 40)
      .map((p) => ({ period: p.period, adoptionPct: p.cumulativePct }));

    const state = createSyntheticState("logistic");
    const result = fitSingleModel(state, "logistic", observed);
    expect(result).not.toBeNull();
    expect(result?.metrics.r2 ?? 0).toBeGreaterThan(0.97);
  });
});
