import type { SurvivalPoint } from "../types";

/** Binary search for the month where S(t) crosses the target % */
function findCrossing(series: SurvivalPoint[], targetPct: number): number | null {
  if (series.length < 2) return null;
  if (series[0].survival < targetPct) return 0;
  for (let i = 1; i < series.length; i++) {
    if (series[i].survival <= targetPct) {
      const prev = series[i - 1];
      const curr = series[i];
      const dS = prev.survival - curr.survival;
      if (dS === 0) return curr.month;
      const frac = (prev.survival - targetPct) / dS;
      return prev.month + frac * (curr.month - prev.month);
    }
  }
  return null; // never crosses
}

/** Median duration of therapy: month where S(t) = 50% */
export function medianDoT(series: SurvivalPoint[]): number | null {
  return findCrossing(series, 50);
}

/** Mean duration of therapy: AUC under survival curve via trapezoidal rule (normalized to %) */
export function meanDoT(series: SurvivalPoint[]): number {
  if (series.length < 2) return 0;
  let auc = 0;
  for (let i = 1; i < series.length; i++) {
    const dt = series[i].month - series[i - 1].month;
    auc += 0.5 * (series[i - 1].survival + series[i].survival) * dt;
  }
  // AUC is in %-months; mean DoT = AUC / 100
  return auc / 100;
}

/** Survival % at a specific month (interpolated) */
export function survivalAtMonth(series: SurvivalPoint[], month: number): number | null {
  if (series.length === 0) return null;
  if (month <= series[0].month) return series[0].survival;
  if (month >= series[series.length - 1].month) return series[series.length - 1].survival;
  for (let i = 1; i < series.length; i++) {
    if (series[i].month >= month) {
      const prev = series[i - 1];
      const curr = series[i];
      const frac = (month - prev.month) / (curr.month - prev.month);
      return prev.survival + frac * (curr.survival - prev.survival);
    }
  }
  return series[series.length - 1].survival;
}

export interface PersistencyMetrics {
  medianDoT: number | null;
  meanDoT: number;
  survivalAt6: number | null;
  survivalAt12: number | null;
  survivalAt24: number | null;
  annualVials: number | null;
}

/** Compute all business metrics from a survival series */
export function computeMetrics(series: SurvivalPoint[], monthlyDose: number): PersistencyMetrics {
  const mean = meanDoT(series);
  return {
    medianDoT: medianDoT(series),
    meanDoT: mean,
    survivalAt6: survivalAtMonth(series, 6),
    survivalAt12: survivalAtMonth(series, 12),
    survivalAt24: survivalAtMonth(series, 24),
    annualVials: monthlyDose > 0 ? mean * monthlyDose * 12 / (series.length > 0 ? Math.min(series[series.length - 1].month, 12) : 12) : null
  };
}
