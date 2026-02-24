import type { Milestones } from "../types";
import { inferredMilestonePeriod, richardsInflectionPctOfCeiling } from "./models";

export function deriveMilestones(cumulativePct: number[], incrementalPct: number[], ceilingPct: number): Milestones {
  let peakGrowthPct = 0;
  let peakGrowthAt = 1;
  for (let i = 0; i < incrementalPct.length; i += 1) {
    if (incrementalPct[i] > peakGrowthPct) {
      peakGrowthPct = incrementalPct[i];
      peakGrowthAt = i + 1;
    }
  }

  // "Peak At" = period when curve reaches 99% of ceiling (practical saturation)
  const peakAt = inferredMilestonePeriod(cumulativePct, ceilingPct, 99);

  return {
    reach10: inferredMilestonePeriod(cumulativePct, ceilingPct, 10),
    reach50: inferredMilestonePeriod(cumulativePct, ceilingPct, 50),
    reach90: inferredMilestonePeriod(cumulativePct, ceilingPct, 90),
    peakGrowthPct,
    peakGrowthAt,
    peakAt,
    ceilingPct
  };
}

export function richardsInflectionLabel(nu: number): string {
  return `Inflection at ${richardsInflectionPctOfCeiling(nu).toFixed(2)}% of ceiling`;
}
