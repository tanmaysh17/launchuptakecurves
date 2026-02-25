import type { Bound } from "../../lib/fitting/nelderMead";
import { boundedNelderMead } from "../../lib/fitting/nelderMead";
import type { FitResult, FittableCurveModel, KMDataPoint, TargetPoint } from "../types";
import { exponentialSurvival, logNormalSurvival, mixtureCureSurvival, weibullSurvival } from "./curves";

function sse(data: KMDataPoint[], predicted: (t: number) => number): number {
  return data.reduce((sum, pt) => {
    const diff = pt.survival - predicted(pt.month);
    return sum + diff * diff;
  }, 0);
}

function rSquared(data: KMDataPoint[], predicted: (t: number) => number): number {
  const mean = data.reduce((s, p) => s + p.survival, 0) / data.length;
  const ssTot = data.reduce((s, p) => s + (p.survival - mean) ** 2, 0);
  const ssRes = sse(data, predicted);
  if (ssTot === 0) return 0;
  return 1 - ssRes / ssTot;
}

export function fitWeibull(data: KMDataPoint[]): FitResult {
  const bounds: Bound[] = [
    { min: 0.5, max: 60 },   // lambda
    { min: 0.2, max: 5 },    // k
    { min: 50, max: 100 }    // ceiling
  ];
  const start = [8, 1, 100];
  const objective = (x: number[]) => sse(data, (t) => weibullSurvival(t, x[0], x[1], x[2]));
  const result = boundedNelderMead(objective, bounds, start, { maxIterations: 600 });
  const predicted = (t: number) => weibullSurvival(t, result.x[0], result.x[1], result.x[2]);
  return {
    model: "weibull",
    params: { lambda: result.x[0], k: result.x[1], ceiling: result.x[2] },
    r2: rSquared(data, predicted),
    sse: result.fx
  };
}

export function fitExponential(data: KMDataPoint[]): FitResult {
  const bounds: Bound[] = [
    { min: 0.005, max: 1 },  // lambda
    { min: 50, max: 100 }    // ceiling
  ];
  const start = [0.1, 100];
  const objective = (x: number[]) => sse(data, (t) => exponentialSurvival(t, x[0], x[1]));
  const result = boundedNelderMead(objective, bounds, start, { maxIterations: 600 });
  const predicted = (t: number) => exponentialSurvival(t, result.x[0], result.x[1]);
  return {
    model: "exponential",
    params: { lambda: result.x[0], ceiling: result.x[1] },
    r2: rSquared(data, predicted),
    sse: result.fx
  };
}

export function fitLogNormal(data: KMDataPoint[]): FitResult {
  const bounds: Bound[] = [
    { min: 1, max: 60 },     // medianMonths
    { min: 0.1, max: 3 },    // sigma
    { min: 50, max: 100 }    // ceiling
  ];
  const start = [12, 0.8, 100];
  const objective = (x: number[]) => sse(data, (t) => logNormalSurvival(t, x[0], x[1], x[2]));
  const result = boundedNelderMead(objective, bounds, start, { maxIterations: 600 });
  const predicted = (t: number) => logNormalSurvival(t, result.x[0], result.x[1], result.x[2]);
  return {
    model: "logNormal",
    params: { medianMonths: result.x[0], sigma: result.x[1], ceiling: result.x[2] },
    r2: rSquared(data, predicted),
    sse: result.fx
  };
}

export function fitMixtureCure(data: KMDataPoint[]): FitResult {
  const bounds: Bound[] = [
    { min: 0.01, max: 0.8 }, // pi (cure fraction)
    { min: 0.5, max: 60 },   // lambda
    { min: 0.2, max: 5 }     // k
  ];
  const start = [0.2, 8, 1];
  const objective = (x: number[]) => sse(data, (t) => mixtureCureSurvival(t, x[0], x[1], x[2]));
  const result = boundedNelderMead(objective, bounds, start, { maxIterations: 600 });
  const predicted = (t: number) => mixtureCureSurvival(t, result.x[0], result.x[1], result.x[2]);
  return {
    model: "mixtureCure",
    params: { pi: result.x[0], lambda: result.x[1], k: result.x[2] },
    r2: rSquared(data, predicted),
    sse: result.fx
  };
}

/** Fit all parametric models and return results sorted by R² descending */
export function fitAllModels(data: KMDataPoint[]): FitResult[] {
  if (data.length < 2) return [];
  const results = [
    fitWeibull(data),
    fitExponential(data),
    fitLogNormal(data),
    fitMixtureCure(data)
  ];
  results.sort((a, b) => b.r2 - a.r2);
  return results;
}

/** Fit all models and return as a map keyed by model name */
export function fitAllModelsAsMap(data: KMDataPoint[]): Partial<Record<FittableCurveModel, FitResult>> {
  const results = fitAllModels(data);
  return Object.fromEntries(results.map((r) => [r.model, r])) as Partial<Record<FittableCurveModel, FitResult>>;
}

/** Convert target points to KM data points for fitting */
export function targetsToKMData(targets: TargetPoint[]): KMDataPoint[] {
  return targets.map((t) => ({ month: t.month, survival: t.survival }));
}

/** Find the best result from a map of fit results */
export function bestFitFromMap(map: Partial<Record<FittableCurveModel, FitResult>>): FitResult | null {
  const results = Object.values(map).filter(Boolean) as FitResult[];
  if (!results.length) return null;
  return [...results].sort((a, b) => b.r2 - a.r2)[0];
}

/** Parse KM data from CSV/TSV text: expects month,survival columns */
export function parseKMData(text: string): { data: KMDataPoint[]; error: string | null } {
  if (!text.trim()) return { data: [], error: null };
  const lines = text.trim().split(/\r?\n/);
  const data: KMDataPoint[] = [];
  let startIdx = 0;

  // Detect header
  const firstLine = lines[0].trim();
  if (firstLine.match(/[a-zA-Z]/)) {
    startIdx = 1;
  }

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(/[,\t;]+/);
    if (parts.length < 2) continue;
    const month = Number(parts[0]);
    const survival = Number(parts[1]);
    if (!Number.isFinite(month) || !Number.isFinite(survival)) {
      return { data: [], error: `Invalid data on line ${i + 1}: "${line}"` };
    }
    if (month < 0) {
      return { data: [], error: `Month must be >= 0 on line ${i + 1}` };
    }
    if (survival < 0 || survival > 100) {
      return { data: [], error: `Survival must be 0–100 on line ${i + 1}` };
    }
    data.push({ month, survival });
  }

  data.sort((a, b) => a.month - b.month);
  return { data, error: null };
}
