import { describe, it, expect } from "vitest";
import { medianDoT, meanDoT, survivalAtMonth } from "../lib/metrics";
import type { SurvivalPoint } from "../types";

function makeSeries(values: [number, number][]): SurvivalPoint[] {
  return values.map(([month, survival]) => ({ month, survival, hazard: 0 }));
}

describe("medianDoT", () => {
  it("finds median by interpolation", () => {
    const series = makeSeries([
      [0, 100],
      [6, 60],
      [12, 40],
      [18, 20],
      [24, 10]
    ]);
    const median = medianDoT(series);
    expect(median).not.toBeNull();
    expect(median!).toBeCloseTo(9, 0); // between 6 and 12
  });

  it("returns null if survival never drops below 50", () => {
    const series = makeSeries([
      [0, 100],
      [12, 80],
      [24, 60]
    ]);
    expect(medianDoT(series)).toBeNull();
  });

  it("returns 0 if starts below 50", () => {
    const series = makeSeries([
      [0, 40],
      [12, 20]
    ]);
    expect(medianDoT(series)).toBe(0);
  });
});

describe("meanDoT", () => {
  it("computes AUC correctly for linear decay", () => {
    // Linear from 100% at month 0 to 0% at month 20
    const series = makeSeries([
      [0, 100],
      [20, 0]
    ]);
    // AUC = 0.5 * 20 * 100 = 1000 %-months
    // Mean = 1000 / 100 = 10 months
    expect(meanDoT(series)).toBeCloseTo(10, 1);
  });

  it("computes AUC for constant 100%", () => {
    const series = makeSeries([
      [0, 100],
      [12, 100]
    ]);
    // AUC = 12 * 100 = 1200; mean = 12
    expect(meanDoT(series)).toBeCloseTo(12, 1);
  });
});

describe("survivalAtMonth", () => {
  const series = makeSeries([
    [0, 100],
    [6, 70],
    [12, 40],
    [24, 10]
  ]);

  it("returns exact value at a knot", () => {
    expect(survivalAtMonth(series, 6)).toBeCloseTo(70, 1);
  });

  it("interpolates between points", () => {
    expect(survivalAtMonth(series, 3)).toBeCloseTo(85, 0);
    expect(survivalAtMonth(series, 9)).toBeCloseTo(55, 0);
  });

  it("returns boundary values", () => {
    expect(survivalAtMonth(series, 0)).toBe(100);
    expect(survivalAtMonth(series, 30)).toBe(10);
  });
});
