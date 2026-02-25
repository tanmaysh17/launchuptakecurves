import { describe, it, expect } from "vitest";
import { simulateCohort } from "../lib/cohort";
import type { ModelParams } from "../types";

const defaultParams: ModelParams = {
  weibull: { lambda: 8, k: 0.7, ceiling: 100 },
  exponential: { lambda: 0.1, ceiling: 100 },
  logNormal: { medianMonths: 12, sigma: 0.8, ceiling: 100 },
  piecewise: { knots: [{ month: 0, survival: 100 }, { month: 12, survival: 50 }] },
  mixtureCure: { pi: 0.25, lambda: 8, k: 1 }
};

describe("simulateCohort", () => {
  it("first month has exactly newStarts patients", () => {
    const result = simulateCohort("exponential", defaultParams, 100, 6);
    expect(result[0].totalOnDrug).toBeCloseTo(100, 0);
    expect(result[0].cohortContributions).toHaveLength(1);
  });

  it("total on drug increases then may stabilize", () => {
    const result = simulateCohort("exponential", defaultParams, 100, 24);
    expect(result).toHaveLength(24);
    // Month 0 = 100 patients, month 1 should have more (100 new + some from cohort 0)
    expect(result[1].totalOnDrug).toBeGreaterThan(result[0].totalOnDrug);
  });

  it("cohort contributions sum to totalOnDrug", () => {
    const result = simulateCohort("weibull", defaultParams, 50, 12);
    for (const m of result) {
      const sum = m.cohortContributions.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(m.totalOnDrug, 0);
    }
  });

  it("each month adds one more cohort", () => {
    const result = simulateCohort("exponential", defaultParams, 100, 6);
    for (let i = 0; i < result.length; i++) {
      expect(result[i].cohortContributions).toHaveLength(i + 1);
    }
  });

  it("with constant survival (ceiling=100, very long lambda), total grows linearly", () => {
    const params: ModelParams = {
      ...defaultParams,
      exponential: { lambda: 0.0001, ceiling: 100 } // near-zero dropout
    };
    const result = simulateCohort("exponential", params, 100, 10);
    // At month 9, should be ~1000 (100 * 10 cohorts, nearly all surviving)
    expect(result[9].totalOnDrug).toBeGreaterThan(950);
  });
});
