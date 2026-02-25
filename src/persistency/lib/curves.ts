import type { CurveModel, ModelParams, SurvivalPoint, PiecewiseKnot } from "../types";

/**
 * Rational approximation of the standard normal CDF Phi(z).
 * Abramowitz & Stegun formula 26.2.17, max error ~7.5e-8.
 */
export function normalCDF(z: number): number {
  if (z < -8) return 0;
  if (z > 8) return 1;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

/** Weibull survival: S(t) = ceiling * exp(-(t/lambda)^k) */
export function weibullSurvival(t: number, lambda: number, k: number, ceiling: number): number {
  if (t <= 0) return ceiling;
  return ceiling * Math.exp(-Math.pow(t / lambda, k));
}

/** Exponential survival: S(t) = ceiling * exp(-lambda * t) */
export function exponentialSurvival(t: number, lambda: number, ceiling: number): number {
  if (t <= 0) return ceiling;
  return ceiling * Math.exp(-lambda * t);
}

/** Log-normal survival: S(t) = ceiling * (1 - Phi((ln(t) - ln(median)) / sigma)) */
export function logNormalSurvival(t: number, medianMonths: number, sigma: number, ceiling: number): number {
  if (t <= 0) return ceiling;
  const z = (Math.log(t) - Math.log(medianMonths)) / sigma;
  return ceiling * (1 - normalCDF(z));
}

/** Piecewise linear survival: linear interpolation between knots */
export function piecewiseLinearSurvival(t: number, knots: PiecewiseKnot[]): number {
  if (knots.length === 0) return 100;
  if (t <= knots[0].month) return knots[0].survival;
  if (t >= knots[knots.length - 1].month) return knots[knots.length - 1].survival;
  for (let i = 1; i < knots.length; i++) {
    if (t <= knots[i].month) {
      const prev = knots[i - 1];
      const curr = knots[i];
      const frac = (t - prev.month) / (curr.month - prev.month);
      return prev.survival + frac * (curr.survival - prev.survival);
    }
  }
  return knots[knots.length - 1].survival;
}

/** Mixture cure model: S(t) = pi + (1-pi) * exp(-(t/lambda)^k) */
export function mixtureCureSurvival(t: number, pi: number, lambda: number, k: number): number {
  if (t <= 0) return 100;
  const uncuredSurv = Math.exp(-Math.pow(t / lambda, k));
  return (pi + (1 - pi) * uncuredSurv) * 100;
}

/** Compute survival value for any model at time t */
export function survivalAt(model: CurveModel, params: ModelParams, t: number): number {
  switch (model) {
    case "weibull":
      return weibullSurvival(t, params.weibull.lambda, params.weibull.k, params.weibull.ceiling);
    case "exponential":
      return exponentialSurvival(t, params.exponential.lambda, params.exponential.ceiling);
    case "logNormal":
      return logNormalSurvival(t, params.logNormal.medianMonths, params.logNormal.sigma, params.logNormal.ceiling);
    case "piecewise":
      return piecewiseLinearSurvival(t, params.piecewise.knots);
    case "mixtureCure":
      return mixtureCureSurvival(t, params.mixtureCure.pi, params.mixtureCure.lambda, params.mixtureCure.k);
  }
}

/** Compute hazard rate h(t) = -S'(t)/S(t) via finite difference */
function hazardAtPoint(model: CurveModel, params: ModelParams, t: number): number {
  const dt = 0.01;
  const s1 = survivalAt(model, params, Math.max(0, t - dt / 2));
  const s2 = survivalAt(model, params, t + dt / 2);
  if (s1 <= 0) return 0;
  return Math.max(0, -(s2 - s1) / dt / s1);
}

/** Analytical hazard for Weibull: h(t) = (k/lambda)*(t/lambda)^(k-1) */
function weibullHazard(t: number, lambda: number, k: number): number {
  if (t <= 0) return k < 1 ? Infinity : k === 1 ? 1 / lambda : 0;
  return (k / lambda) * Math.pow(t / lambda, k - 1);
}

/** Compute hazard rate using analytical formula where available, finite diff otherwise */
function computeHazard(model: CurveModel, params: ModelParams, t: number): number {
  switch (model) {
    case "weibull":
      return weibullHazard(t, params.weibull.lambda, params.weibull.k);
    case "exponential":
      return params.exponential.lambda;
    case "mixtureCure": {
      const mc = params.mixtureCure;
      const wh = weibullHazard(t, mc.lambda, mc.k);
      const ws = Math.exp(-Math.pow(t / mc.lambda, mc.k));
      const sTotal = mc.pi + (1 - mc.pi) * ws;
      if (sTotal <= 0) return 0;
      return ((1 - mc.pi) * ws * wh) / sTotal;
    }
    default:
      return hazardAtPoint(model, params, t);
  }
}

/** Generate full survival + hazard series for a model over [0, horizon] months */
export function computeSeries(model: CurveModel, params: ModelParams, horizon: number): SurvivalPoint[] {
  const points: SurvivalPoint[] = [];
  for (let m = 0; m <= horizon; m++) {
    points.push({
      month: m,
      survival: survivalAt(model, params, m),
      hazard: m === 0 ? computeHazard(model, params, 0.5) : computeHazard(model, params, m)
    });
  }
  return points;
}
