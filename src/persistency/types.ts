export type CurveModel = "weibull" | "exponential" | "logNormal" | "piecewise" | "mixtureCure";

export type FittableCurveModel = "weibull" | "exponential" | "logNormal" | "mixtureCure";

export type ChartView = "survival" | "hazard";

export type LeftTab = "parameters" | "fit";

export type ThemeMode = "dark" | "light";

export interface WeibullParams {
  lambda: number; // scale (characteristic life)
  k: number;      // shape
  ceiling: number; // max % starting on therapy (0–100)
}

export interface ExponentialParams {
  lambda: number;  // constant hazard rate
  ceiling: number;
}

export interface LogNormalParams {
  medianMonths: number;
  sigma: number;
  ceiling: number;
}

export interface PiecewiseKnot {
  month: number;
  survival: number; // 0–100
}

export interface PiecewiseParams {
  knots: PiecewiseKnot[];
}

export interface MixtureCureParams {
  pi: number;     // cure fraction (0–1)
  lambda: number; // Weibull scale for uncured
  k: number;      // Weibull shape for uncured
}

export type ModelParams = {
  weibull: WeibullParams;
  exponential: ExponentialParams;
  logNormal: LogNormalParams;
  piecewise: PiecewiseParams;
  mixtureCure: MixtureCureParams;
};

export interface SurvivalPoint {
  month: number;
  survival: number; // 0–100
  hazard: number;   // instantaneous hazard rate
}

export interface BenchmarkCurve {
  id: string;
  label: string;
  model: CurveModel;
  params: ModelParams[CurveModel];
  color: string;
}

export interface KMDataPoint {
  month: number;
  survival: number; // 0–100
}

export interface TargetPoint {
  month: number;
  survival: number; // 0–100
}

export interface FitResult {
  model: CurveModel;
  params: ModelParams[CurveModel];
  r2: number;
  sse: number;
}

export interface CohortMonth {
  month: number;
  totalOnDrug: number;
  cohortContributions: number[];
}

export interface Preset {
  id: string;
  label: string;
  description: string;
  model: CurveModel;
  params: ModelParams[CurveModel];
}

// Scenario comparison
export interface PersistencyScenario {
  id: string;
  name: string;
  color: string;
  model: CurveModel;
  paramsSnapshot: ModelParams[CurveModel];
}

// Shareable state (for URL sharing and session save/restore)
export interface ShareablePersistencyState {
  activeModel: CurveModel;
  params: ModelParams;
  horizon: number;
  chartView: ChartView;
  theme: ThemeMode;
  scenarios: PersistencyScenario[];
  editingScenarioId: string | null;
  benchmarks: { id: string; enabled: boolean }[];
  cohortNewStarts: number;
  cohortMonths: number;
  monthlyDose: number;
}

export interface PersistencyState {
  activeModel: CurveModel;
  params: ModelParams;
  horizon: number;
  leftTab: LeftTab;
  chartView: ChartView;
  theme: ThemeMode;
  toast: string | null;
  activePresetId: string | null;

  // Scenarios
  scenarios: PersistencyScenario[];
  editingScenarioId: string | null;

  // Benchmarks
  benchmarks: { id: string; enabled: boolean }[];

  // KM fitting
  kmRawInput: string;
  kmData: KMDataPoint[];
  kmError: string | null;
  kmFitting: boolean;
  kmFitResults: Partial<Record<FittableCurveModel, FitResult>>;
  kmStagedFit: FitResult | null;

  // Target fitting
  targetInput: string;
  targets: TargetPoint[];

  // Cohort simulation
  cohortExpanded: boolean;
  cohortNewStarts: number;
  cohortMonths: number;

  // Metrics
  monthlyDose: number;

  // Export
  exportOpen: boolean;
}

export type PersistencyAction =
  | { type: "setActiveModel"; model: CurveModel }
  | { type: "setWeibullParam"; key: keyof WeibullParams; value: number }
  | { type: "setExponentialParam"; key: keyof ExponentialParams; value: number }
  | { type: "setLogNormalParam"; key: keyof LogNormalParams; value: number }
  | { type: "setPiecewiseKnots"; knots: PiecewiseKnot[] }
  | { type: "setMixtureCureParam"; key: keyof MixtureCureParams; value: number }
  | { type: "setHorizon"; value: number }
  | { type: "setLeftTab"; tab: LeftTab }
  | { type: "setChartView"; view: ChartView }
  | { type: "setTheme"; theme: ThemeMode }
  | { type: "setToast"; value: string | null }
  | { type: "toggleBenchmark"; id: string }
  | { type: "setKMRawInput"; value: string }
  | { type: "setKMData"; data: KMDataPoint[]; error: string | null }
  | { type: "setKMFitting"; value: boolean }
  | { type: "setKMFitResults"; results: Partial<Record<FittableCurveModel, FitResult>> }
  | { type: "setKMStagedFit"; result: FitResult | null }
  | { type: "applyFitResult" }
  | { type: "loadPreset"; preset: Preset }
  | { type: "setTargetInput"; value: string }
  | { type: "setTargets"; targets: TargetPoint[] }
  | { type: "setCohortExpanded"; value: boolean }
  | { type: "setCohortNewStarts"; value: number }
  | { type: "setCohortMonths"; value: number }
  | { type: "setMonthlyDose"; value: number }
  | { type: "setExportOpen"; value: boolean }
  // Scenario actions
  | { type: "addScenario" }
  | { type: "clearScenarios" }
  | { type: "removeScenario"; id: string }
  | { type: "renameScenario"; id: string; name: string }
  | { type: "selectScenario"; id: string | null }
  // Session actions
  | { type: "loadSession"; session: ShareablePersistencyState };
