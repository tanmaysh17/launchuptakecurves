import type { CohortMonth, CurveModel, ModelParams } from "../types";
import { survivalAt } from "./curves";

/**
 * Simulate a cohort waterfall: each month, `newStarts` patients begin therapy.
 * Each cohort's remaining patients follow the survival curve.
 * Returns monthly totals and per-cohort contributions.
 */
export function simulateCohort(
  model: CurveModel,
  params: ModelParams,
  newStarts: number,
  simMonths: number
): CohortMonth[] {
  const results: CohortMonth[] = [];

  for (let m = 0; m < simMonths; m++) {
    const contributions: number[] = [];
    let total = 0;

    // Each cohort started at month c contributes patients at month m
    for (let c = 0; c <= m; c++) {
      const monthsOnTherapy = m - c;
      const survPct = survivalAt(model, params, monthsOnTherapy);
      const remaining = newStarts * (survPct / 100);
      contributions.push(remaining);
      total += remaining;
    }

    results.push({
      month: m,
      totalOnDrug: Math.round(total * 100) / 100,
      cohortContributions: contributions
    });
  }

  return results;
}
