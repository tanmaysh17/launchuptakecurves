import { describe, it, expect } from "vitest";
import {
  normalCDF,
  weibullSurvival,
  exponentialSurvival,
  logNormalSurvival,
  piecewiseLinearSurvival,
  mixtureCureSurvival,
  computeSeries
} from "../lib/curves";
import type { ModelParams } from "../types";

describe("normalCDF", () => {
  it("returns 0.5 at z=0", () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 5);
  });
  it("returns ~0.8413 at z=1", () => {
    expect(normalCDF(1)).toBeCloseTo(0.8413, 3);
  });
  it("returns ~0.1587 at z=-1", () => {
    expect(normalCDF(-1)).toBeCloseTo(0.1587, 3);
  });
  it("returns ~0 for very negative z", () => {
    expect(normalCDF(-10)).toBe(0);
  });
  it("returns ~1 for very positive z", () => {
    expect(normalCDF(10)).toBe(1);
  });
});

describe("weibullSurvival", () => {
  it("returns ceiling at t=0", () => {
    expect(weibullSurvival(0, 10, 1, 100)).toBe(100);
  });
  it("returns ~36.8% of ceiling at t=lambda when k=1", () => {
    expect(weibullSurvival(10, 10, 1, 100)).toBeCloseTo(36.79, 1);
  });
  it("approaches 0 for large t", () => {
    expect(weibullSurvival(100, 5, 2, 100)).toBeCloseTo(0, 2);
  });
  it("respects ceiling", () => {
    expect(weibullSurvival(0, 10, 1, 80)).toBe(80);
    expect(weibullSurvival(10, 10, 1, 80)).toBeCloseTo(80 * Math.exp(-1), 1);
  });
});

describe("exponentialSurvival", () => {
  it("returns ceiling at t=0", () => {
    expect(exponentialSurvival(0, 0.1, 100)).toBe(100);
  });
  it("median at ln(2)/lambda", () => {
    const lambda = 0.1;
    const medianT = Math.log(2) / lambda;
    expect(exponentialSurvival(medianT, lambda, 100)).toBeCloseTo(50, 1);
  });
  it("decays to near 0", () => {
    expect(exponentialSurvival(50, 0.2, 100)).toBeCloseTo(0, 1);
  });
});

describe("logNormalSurvival", () => {
  it("returns ceiling at t=0", () => {
    expect(logNormalSurvival(0, 12, 0.8, 100)).toBe(100);
  });
  it("returns ~50% at t=median", () => {
    expect(logNormalSurvival(12, 12, 0.8, 100)).toBeCloseTo(50, 0);
  });
  it("respects ceiling", () => {
    expect(logNormalSurvival(0, 10, 1, 90)).toBe(90);
  });
});

describe("piecewiseLinearSurvival", () => {
  const knots = [
    { month: 0, survival: 100 },
    { month: 6, survival: 70 },
    { month: 12, survival: 30 },
    { month: 24, survival: 5 }
  ];

  it("returns first knot at t=0", () => {
    expect(piecewiseLinearSurvival(0, knots)).toBe(100);
  });
  it("returns last knot at end", () => {
    expect(piecewiseLinearSurvival(24, knots)).toBe(5);
  });
  it("interpolates linearly between knots", () => {
    expect(piecewiseLinearSurvival(3, knots)).toBeCloseTo(85, 0);
    expect(piecewiseLinearSurvival(9, knots)).toBeCloseTo(50, 0);
  });
  it("clamps beyond last knot", () => {
    expect(piecewiseLinearSurvival(30, knots)).toBe(5);
  });
});

describe("mixtureCureSurvival", () => {
  it("returns 100 at t=0", () => {
    expect(mixtureCureSurvival(0, 0.3, 8, 1)).toBe(100);
  });
  it("plateaus at pi*100 for large t", () => {
    expect(mixtureCureSurvival(200, 0.3, 8, 1)).toBeCloseTo(30, 0);
  });
  it("is between pi*100 and 100 for intermediate t", () => {
    const s = mixtureCureSurvival(8, 0.3, 8, 1);
    expect(s).toBeGreaterThan(30);
    expect(s).toBeLessThan(100);
  });
});

describe("computeSeries", () => {
  it("generates correct number of points", () => {
    const params: ModelParams = {
      weibull: { lambda: 8, k: 0.7, ceiling: 100 },
      exponential: { lambda: 0.1, ceiling: 100 },
      logNormal: { medianMonths: 12, sigma: 0.8, ceiling: 100 },
      piecewise: { knots: [{ month: 0, survival: 100 }, { month: 12, survival: 50 }] },
      mixtureCure: { pi: 0.25, lambda: 8, k: 1 }
    };
    const result = computeSeries("weibull", params, 24);
    expect(result).toHaveLength(25); // 0 through 24
    expect(result[0].month).toBe(0);
    expect(result[24].month).toBe(24);
    expect(result[0].survival).toBe(100);
    expect(result[0].hazard).toBeGreaterThan(0);
  });
});
