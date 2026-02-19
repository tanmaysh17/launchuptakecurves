import type { ComputedSeries, CoreParams, ModelParams, ModelType, Scenario, TimeUnit } from "../types";

export const MODEL_LABELS: Record<ModelType, string> = {
  logistic: "Logistic",
  gompertz: "Gompertz",
  richards: "Richards",
  bass: "Bass Diffusion",
  linear: "Linear Ramp"
};

export const SCENARIO_COLORS = ["#00d4b4", "#f0a500", "#a78bfa", "#ff6b9a"] as const;

export const DEFAULT_CORE: CoreParams = {
  ceilingPct: 100,
  horizon: 60,
  timeUnit: "months",
  launchLag: 0,
  outputUnit: "percent",
  tam: null
};

export const DEFAULT_PARAMS: ModelParams = {
  logistic: { k: 0.3, t0: 18 },
  gompertz: { k: 0.25, t0: 18 },
  richards: { k: 0.3, t0: 18, nu: 1.0 },
  bass: { p: 0.03, q: 0.38 },
  linear: { r: 2.5 }
};

export const MODEL_ORDER: ModelType[] = ["logistic", "gompertz", "richards", "bass", "linear"];

export const MODEL_DESCRIPTIONS: Record<
  ModelType,
  {
    oneLiner: string;
    background: string;
    inflection: string;
    useCases: string;
    bestPractices: string[];
    parameterGuide: string[];
    ranges: string;
    notes?: string;
  }
> = {
  logistic: {
    oneLiner: "A symmetric S-curve with adoption accelerating then decelerating around a midpoint.",
    background:
      "Use this when market friction and acceleration are roughly balanced over the launch lifecycle. Logistic is often the first baseline for SaaS and digital products.",
    inflection: "Inflection is fixed at exactly 50% of ceiling.",
    useCases: "SaaS rollouts, consumer tech, balanced adoption dynamics.",
    bestPractices: [
      "Anchor t0 to the expected midpoint of real adoption momentum, not launch date.",
      "Start with ceiling from commercial assumptions and adjust k only after t0 feels realistic.",
      "Use scenario bands (low/base/high k) to represent execution uncertainty."
    ],
    parameterGuide: [
      "L (ceiling): maximum reachable penetration in this segment.",
      "k (steepness): how quickly adoption climbs around the middle.",
      "t0 (inflection): period of fastest incremental growth."
    ],
    ranges: "Typical start: k 0.15-0.45, t0 near the expected midpoint period."
  },
  gompertz: {
    oneLiner: "An asymmetric S-curve with slower early movement and earlier inflection.",
    background:
      "Gompertz is useful when onboarding, reimbursement, procurement, or behavior change delays the first phase of uptake. It is common in pharma and enterprise launches.",
    inflection: "Inflection occurs near 36.8% of ceiling, not 50%.",
    useCases: "Pharma launches, enterprise B2B adoption, high initial inertia.",
    bestPractices: [
      "Use when early adoption historically lags despite strong later acceleration.",
      "Set conservative early-period checkpoints to avoid over-forecasting launch ramp.",
      "Compare against logistic to test whether asymmetry is truly present in analog data."
    ],
    parameterGuide: [
      "L (ceiling): long-run penetration cap.",
      "k (steepness): later-phase acceleration intensity once inertia breaks.",
      "t0 (reference): timing anchor that shifts the curve left/right."
    ],
    ranges: "Typical start: k 0.10-0.35, t0 slightly earlier than logistic equivalents."
  },
  richards: {
    oneLiner: "A generalized logistic master curve that flexes between symmetric and asymmetric adoption.",
    background:
      "Richards is the most flexible S-curve family and is preferred when you are uncertain about shape. It nests Logistic and approximates Gompertz, so it is ideal for fitting analog launch data.",
    inflection: "Inflection level moves with nu: nu=1 logistic, nu->0 gompertz-like, nu>1 late inflection.",
    useCases: "Uncertain launch shape, analog-data fitting, scenario exploration.",
    bestPractices: [
      "Start at nu=1 and only move away when data or logic supports asymmetry.",
      "Constrain nu to plausible bounds to avoid overfitting sparse observations.",
      "Use Richards as master model, then communicate simplified logistic/gompertz equivalents."
    ],
    parameterGuide: [
      "L (ceiling): total reachable penetration.",
      "k (steepness): growth intensity around transition zone.",
      "t0 (reference): central timing control for the curve.",
      "nu (shape): asymmetry lever controlling early vs late skew."
    ],
    ranges: "Typical start: k 0.15-0.45, t0 around midpoint, nu 0.6-2.0.",
    notes: "nu=1 is Logistic, nu->0 approaches Gompertz, nu>1 creates slow-build/fast-finish."
  },
  bass: {
    oneLiner: "Diffusion model split into innovation (p) and imitation (q) effects.",
    background:
      "Bass models adoption as external pull plus social contagion. It is strong when word-of-mouth and network effects materially change conversion probability over time.",
    inflection: "Peak incremental adoption is driven by p/q balance and social reinforcement.",
    useCases: "Durables, consumer electronics, network-effect products.",
    bestPractices: [
      "Set p from paid/media/commercial push assumptions; set q from social/network mechanics.",
      "Validate implied peak timing against channel and supply reality.",
      "Use periodic-rate view to sanity-check demand planning and sales capacity."
    ],
    parameterGuide: [
      "p (innovation): baseline adoption probability from external influence.",
      "q (imitation): incremental social/word-of-mouth adoption effect.",
      "M or L (market potential): upper penetration bound for the target market."
    ],
    ranges: "Benchmarks: p around 0.03, q around 0.38; common ranges p 0.001-0.05, q 0.1-0.6.",
    notes: "Interpretation: p = external pull, q = word-of-mouth and social contagion."
  },
  linear: {
    oneLiner: "A conservative straight-line ramp to ceiling after optional lag.",
    background:
      "Linear is a policy baseline, not a behavioral diffusion model. It is useful when adoption is primarily capacity- or process-constrained rather than social.",
    inflection: "No inflection point; uptake increases at constant rate until capped.",
    useCases: "Regulated, operationally constrained, or manually-driven adoption.",
    bestPractices: [
      "Use as a downside or control-case benchmark against nonlinear models.",
      "Tie ramp rate to execution throughput, not market enthusiasm.",
      "Revisit frequently if evidence of acceleration appears."
    ],
    parameterGuide: [
      "L (ceiling): maximum reachable penetration.",
      "r (ramp rate): fixed percentage added each period after lag.",
      "lag: waiting periods before ramp begins."
    ],
    ranges: "Typical start: ramp rate 1%-5% per period, tune lag for delayed starts."
  }
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function periodLabel(period: number, unit: TimeUnit): string {
  const prefix = unit === "months" ? "Month" : "Week";
  return `${prefix} ${period}`;
}

export function richardsInflectionPctOfCeiling(nu: number): number {
  const n = Math.max(1e-6, nu);
  return Math.pow(n / (1 + n), 1 / n) * 100;
}

interface ComputeInput {
  model: ModelType;
  core: Pick<CoreParams, "ceilingPct" | "horizon" | "launchLag" | "timeUnit" | "tam">;
  params: ModelParams;
}

export function computeSeries(input: ComputeInput): ComputedSeries {
  const { model, core, params } = input;
  const horizon = Math.max(1, Math.floor(core.horizon));
  const L = clamp(core.ceilingPct, 0, 100);
  const cumulativePct: number[] = [];
  const incrementalPct: number[] = [];
  const points = [];

  let bassPrev = 0;

  for (let period = 1; period <= horizon; period += 1) {
    const rawTe = period - core.launchLag;
    const te = Math.max(0, rawTe);
    let cumulative: number;
    if (model === "logistic") {
      if (rawTe <= 0) {
        cumulative = 0;
      } else {
        const { k, t0 } = params.logistic;
        cumulative = L / (1 + Math.exp(-k * (te - t0)));
      }
    } else if (model === "gompertz") {
      if (rawTe <= 0) {
        cumulative = 0;
      } else {
        const { k, t0 } = params.gompertz;
        cumulative = L * Math.exp(-Math.exp(-k * (te - t0)));
      }
    } else if (model === "richards") {
      if (rawTe <= 0) {
        cumulative = 0;
      } else {
        const { k, t0, nu } = params.richards;
        if (nu < 1e-3) {
          cumulative = L * Math.exp(-Math.exp(-k * (te - t0)));
        } else {
          cumulative = L / Math.pow(1 + nu * Math.exp(-k * (te - t0)), 1 / nu);
        }
      }
    } else if (model === "bass") {
      const { p, q } = params.bass;
      const prevAdoptionTime = Math.max(0, period - 1 - core.launchLag);
      const currAdoptionTime = Math.max(0, period - core.launchLag);
      const dt = currAdoptionTime - prevAdoptionTime;
      if (dt > 0) {
        const dF = (p + (q * bassPrev) / Math.max(1e-9, L)) * (L - bassPrev) * dt;
        bassPrev = clamp(bassPrev + dF, 0, L);
      }
      cumulative = bassPrev;
    } else {
      if (rawTe <= 0) {
        cumulative = 0;
      } else {
        const { r } = params.linear;
        cumulative = Math.min(L, r * te);
      }
    }

    cumulative = clamp(cumulative, 0, L);
    const prev = period === 1 ? 0 : cumulativePct[cumulativePct.length - 1];
    const incremental = clamp(cumulative - prev, 0, L);

    cumulativePct.push(cumulative);
    incrementalPct.push(incremental);

    const cumulativeVolume = core.tam == null ? null : (cumulative / 100) * core.tam;
    const incrementalVolume = core.tam == null ? null : (incremental / 100) * core.tam;

    points.push({
      period,
      label: periodLabel(period, core.timeUnit),
      cumulativePct: cumulative,
      incrementalPct: incremental,
      cumulativeVolume,
      incrementalVolume
    });
  }

  return { points, cumulativePct, incrementalPct };
}

export function computeScenarioSeries(
  scenarios: Scenario[],
  baseCore: Pick<CoreParams, "horizon" | "timeUnit" | "tam">,
  params: ModelParams
): Array<{ scenario: Scenario; series: ComputedSeries }> {
  return scenarios.map((scenario) => {
    const scenarioParams: ModelParams = {
      logistic: { ...params.logistic },
      gompertz: { ...params.gompertz },
      richards: { ...params.richards },
      bass: { ...params.bass },
      linear: { ...params.linear }
    };
    if (scenario.model === "logistic") {
      scenarioParams.logistic = scenario.paramsSnapshot as ModelParams["logistic"];
    } else if (scenario.model === "gompertz") {
      scenarioParams.gompertz = scenario.paramsSnapshot as ModelParams["gompertz"];
    } else if (scenario.model === "richards") {
      scenarioParams.richards = scenario.paramsSnapshot as ModelParams["richards"];
    } else if (scenario.model === "bass") {
      scenarioParams.bass = scenario.paramsSnapshot as ModelParams["bass"];
    } else {
      scenarioParams.linear = scenario.paramsSnapshot as ModelParams["linear"];
    }

    const series = computeSeries({
      model: scenario.model,
      core: {
        ceilingPct: scenario.coreSnapshot.ceilingPct,
        launchLag: scenario.coreSnapshot.launchLag,
        horizon: baseCore.horizon,
        timeUnit: baseCore.timeUnit,
        tam: baseCore.tam
      },
      params: scenarioParams
    });
    return { scenario, series };
  });
}

export function inferredMilestonePeriod(
  cumulative: number[],
  ceilingPct: number,
  thresholdPct: number
): number | null {
  const target = (ceilingPct * thresholdPct) / 100;
  for (let i = 0; i < cumulative.length; i += 1) {
    if (cumulative[i] >= target) {
      return i + 1;
    }
  }
  return null;
}

export function inflectionTextForRichards(nu: number): string {
  const inflection = richardsInflectionPctOfCeiling(nu);
  return `Inflection at ${inflection.toFixed(2)}% of ceiling`;
}
