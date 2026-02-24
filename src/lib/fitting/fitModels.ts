import { boundedNelderMead, type Bound } from "./nelderMead";
import { computeSeries, DEFAULT_PARAMS, MODEL_ORDER } from "../models";
import type { AppState, FitMetrics, FitResult, ModelParams, ModelType, ObservedPoint } from "../../types";

interface ParamDef {
  key: string;
  bound: Bound;
}

interface PreparedFit {
  defs: ParamDef[];
  start: number[];
  horizon: number;
}

const FITTABLE_MODELS: ModelType[] = MODEL_ORDER.filter((model) => model !== "linear");

function getDefs(model: ModelType, _horizon: number): ParamDef[] {
  switch (model) {
    case "logistic":
      return [
        { key: "k", bound: { min: 0.05, max: 1.0 } },
        { key: "t0", bound: { min: 0.05, max: 0.95 } },
        { key: "ceilingPct", bound: { min: 1, max: 100 } },
        { key: "launchLag", bound: { min: 0, max: 24 } }
      ];
    case "gompertz":
      return [
        { key: "k", bound: { min: 0.05, max: 1.0 } },
        { key: "t0", bound: { min: 0.05, max: 0.95 } },
        { key: "ceilingPct", bound: { min: 1, max: 100 } },
        { key: "launchLag", bound: { min: 0, max: 24 } }
      ];
    case "richards":
      return [
        { key: "k", bound: { min: 0.05, max: 1.0 } },
        { key: "t0", bound: { min: 0.05, max: 0.95 } },
        { key: "nu", bound: { min: 0.1, max: 5.0 } },
        { key: "ceilingPct", bound: { min: 1, max: 100 } },
        { key: "launchLag", bound: { min: 0, max: 24 } }
      ];
    case "bass":
      return [
        { key: "p", bound: { min: 0.001, max: 0.1 } },
        { key: "q", bound: { min: 0.01, max: 0.8 } },
        { key: "ceilingPct", bound: { min: 1, max: 100 } },
        { key: "launchLag", bound: { min: 0, max: 24 } }
      ];
    case "linear":
      return [];
  }
}

function buildPreparedFit(state: AppState, model: ModelType, data: ObservedPoint[]): PreparedFit {
  const maxDataPeriod = Math.max(...data.map((d) => d.period));
  const horizon = Math.max(state.core.horizon, maxDataPeriod, 12);
  const defs = getDefs(model, horizon);
  const start = defs.map((def) => getCurrentValue(state, model, def.key));
  return { defs, start, horizon };
}

function getCurrentValue(state: AppState, model: ModelType, key: string): number {
  if (key === "ceilingPct") {
    return state.core.ceilingPct;
  }
  if (key === "launchLag") {
    return state.core.launchLag;
  }
  if (model === "logistic") {
    if (key === "k") return state.params.logistic.k;
    if (key === "t0") return state.params.logistic.t0;
  }
  if (model === "gompertz") {
    if (key === "k") return state.params.gompertz.k;
    if (key === "t0") return state.params.gompertz.t0;
  }
  if (model === "richards") {
    if (key === "k") return state.params.richards.k;
    if (key === "t0") return state.params.richards.t0;
    if (key === "nu") return state.params.richards.nu;
  }
  if (model === "bass") {
    if (key === "p") return state.params.bass.p;
    if (key === "q") return state.params.bass.q;
  }
  return 0;
}

function vectorToRecord(defs: ParamDef[], x: number[]): Record<string, number> {
  const out: Record<string, number> = {};
  defs.forEach((d, i) => {
    out[d.key] = x[i];
  });
  return out;
}

function objectiveFor(
  state: AppState,
  model: ModelType,
  data: ObservedPoint[],
  horizon: number,
  defs: ParamDef[]
): (x: number[]) => number {
  return (x) => {
    const values = vectorToRecord(defs, x);
    const ceilingPct = values.ceilingPct ?? state.core.ceilingPct;
    const launchLag = values.launchLag ?? state.core.launchLag;
    const params = candidateParams(state.params, model, values);
    const series = computeSeries({
      model,
      core: {
        ceilingPct,
        launchLag,
        horizon,
        timeUnit: state.core.timeUnit,
        tam: null,
        timeToPeak: null
      },
      params
    });

    let sse = 0;
    for (const point of data) {
      const idx = point.period - 1;
      if (idx < 0 || idx >= series.cumulativePct.length) {
        continue;
      }
      const err = series.cumulativePct[idx] - point.adoptionPct;
      sse += err * err;
    }
    return sse;
  };
}

function candidateParams(base: ModelParams, model: ModelType, values: Record<string, number>): ModelParams {
  const next: ModelParams = {
    logistic: { ...base.logistic },
    gompertz: { ...base.gompertz },
    richards: { ...base.richards },
    bass: { ...base.bass },
    linear: { ...base.linear }
  };

  if (model === "logistic") {
    next.logistic.k = values.k ?? next.logistic.k;
    next.logistic.t0 = values.t0 ?? next.logistic.t0;
  } else if (model === "gompertz") {
    next.gompertz.k = values.k ?? next.gompertz.k;
    next.gompertz.t0 = values.t0 ?? next.gompertz.t0;
  } else if (model === "richards") {
    next.richards.k = values.k ?? next.richards.k;
    next.richards.t0 = values.t0 ?? next.richards.t0;
    next.richards.nu = values.nu ?? next.richards.nu;
  } else if (model === "bass") {
    next.bass.p = values.p ?? next.bass.p;
    next.bass.q = values.q ?? next.bass.q;
  }
  return next;
}

function computeMetrics(y: number[], yhat: number[]): FitMetrics {
  const n = Math.max(1, y.length);
  let ssRes = 0;
  let ssTot = 0;
  let apeSum = 0;
  let apeCount = 0;
  const mean = y.reduce((acc, v) => acc + v, 0) / n;

  for (let i = 0; i < y.length; i += 1) {
    const err = y[i] - yhat[i];
    ssRes += err * err;
    ssTot += (y[i] - mean) ** 2;
    if (Math.abs(y[i]) > 1e-9) {
      apeSum += Math.abs(err / y[i]);
      apeCount += 1;
    }
  }

  const r2 = ssTot < 1e-12 ? (ssRes < 1e-12 ? 1 : 0) : 1 - ssRes / ssTot;
  const rmse = Math.sqrt(ssRes / n);
  const mape = apeCount ? (apeSum / apeCount) * 100 : 0;
  return { r2, rmse, mape };
}

function deterministicRestarts(start: number[], defs: ParamDef[]): number[][] {
  const restarts = [start];
  const p1 = start.map((v, i) => {
    const span = defs[i].bound.max - defs[i].bound.min;
    return clamp(v + 0.08 * span, defs[i].bound.min, defs[i].bound.max);
  });
  const p2 = start.map((v, i) => {
    const span = defs[i].bound.max - defs[i].bound.min;
    return clamp(v - 0.08 * span, defs[i].bound.min, defs[i].bound.max);
  });
  restarts.push(p1, p2);
  return restarts;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function fitSingleModel(state: AppState, model: ModelType, data: ObservedPoint[]): FitResult | null {
  if (!data.length || model === "linear") {
    return null;
  }

  const prepared = buildPreparedFit(state, model, data);
  const objective = objectiveFor(state, model, data, prepared.horizon, prepared.defs);
  let best: { x: number[]; fx: number } | null = null;
  const bounds = prepared.defs.map((d) => d.bound);

  for (const start of deterministicRestarts(prepared.start, prepared.defs)) {
    const res = boundedNelderMead(objective, bounds, start, {
      maxIterations: 350,
      tolerance: 1e-8,
      initialStep: 0.22
    });
    if (!best || res.fx < best.fx) {
      best = { x: res.x, fx: res.fx };
    }
  }

  if (!best) {
    return null;
  }

  const fittedValues = vectorToRecord(prepared.defs, best.x);
  const ceilingPct = fittedValues.ceilingPct ?? state.core.ceilingPct;
  const launchLag = fittedValues.launchLag ?? state.core.launchLag;
  const params = candidateParams(state.params, model, fittedValues);
  const prediction = computeSeries({
    model,
    core: {
      ceilingPct,
      launchLag,
      horizon: prepared.horizon,
      timeUnit: state.core.timeUnit,
      tam: null,
      timeToPeak: null
    },
    params
  });

  const y = data.map((d) => d.adoptionPct);
  const yhat = data.map((d) => prediction.cumulativePct[d.period - 1] ?? 0);
  const metrics = computeMetrics(y, yhat);

  return {
    model,
    params: fittedValues,
    metrics,
    loss: best.fx
  };
}

export function fitComparableModels(state: AppState, data: ObservedPoint[]): FitResult[] {
  const results: FitResult[] = [];
  for (const model of FITTABLE_MODELS) {
    const result = fitSingleModel(state, model, data);
    if (result) {
      results.push(result);
    }
  }
  return results;
}

export function bestFitResult(results: FitResult[]): FitResult | null {
  if (!results.length) {
    return null;
  }
  const sorted = [...results].sort((a, b) => {
    if (a.metrics.rmse !== b.metrics.rmse) {
      return a.metrics.rmse - b.metrics.rmse;
    }
    return b.metrics.r2 - a.metrics.r2;
  });
  return sorted[0];
}

export function applyFitToState(state: AppState, result: FitResult): AppState {
  const params = { ...state.params };
  if (result.model === "logistic") {
    params.logistic = {
      k: result.params.k ?? params.logistic.k,
      t0: result.params.t0 ?? params.logistic.t0
    };
  } else if (result.model === "gompertz") {
    params.gompertz = {
      k: result.params.k ?? params.gompertz.k,
      t0: result.params.t0 ?? params.gompertz.t0
    };
  } else if (result.model === "richards") {
    params.richards = {
      k: result.params.k ?? params.richards.k,
      t0: result.params.t0 ?? params.richards.t0,
      nu: result.params.nu ?? params.richards.nu
    };
  } else if (result.model === "bass") {
    params.bass = {
      p: result.params.p ?? params.bass.p,
      q: result.params.q ?? params.bass.q
    };
  }

  return {
    ...state,
    activeModel: result.model,
    core: {
      ...state.core,
      ceilingPct: result.params.ceilingPct ?? state.core.ceilingPct,
      launchLag: Math.round(result.params.launchLag ?? state.core.launchLag)
    },
    params
  };
}

export function createSyntheticState(model: ModelType): AppState {
  return {
    activeModel: model,
    core: {
      ceilingPct: 100,
      horizon: 60,
      timeUnit: "months",
      launchLag: 0,
      outputUnit: "percent",
      tam: null,
      timeToPeak: null
    },
    params: DEFAULT_PARAMS,
    editingScenarioId: null,
    leftTab: "parameters",
    rightTab: "chart",
    chartMode: "cumulative",
    bassView: "cumulativeOnly",
    scenarios: [],
    fit: {
      rawInput: "",
      data: [],
      error: null,
      fitResults: {},
      stagedFit: null,
      isFitting: false,
      targetInput: "",
      targets: []
    },
    tableSort: { key: "period", dir: "asc" },
    aboutCollapsed: false,
    toast: null,
    theme: "light"
  };
}
