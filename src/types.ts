export type ModelType = "logistic" | "gompertz" | "richards" | "bass" | "linear";
export type TimeUnit = "months" | "weeks";
export type OutputUnit = "percent" | "volume";
export type RightTab = "chart" | "table";
export type LeftTab = "parameters" | "fit";
export type ChartMode = "cumulative" | "growth";
export type BassView = "cumulativeOnly" | "cumulativePlusRate";
export type ThemeMode = "dark" | "light";

export interface CoreParams {
  ceilingPct: number;
  horizon: number;
  timeUnit: TimeUnit;
  launchLag: number;
  outputUnit: OutputUnit;
  tam: number | null;
  timeToPeak: number | null;
}

export interface LogisticParams {
  k: number;
  t0: number;
}

export interface GompertzParams {
  k: number;
  t0: number;
}

export interface RichardsParams {
  k: number;
  t0: number;
  nu: number;
}

export interface BassParams {
  p: number;
  q: number;
}

export interface LinearParams {
  r: number;
}

export interface ModelParams {
  logistic: LogisticParams;
  gompertz: GompertzParams;
  richards: RichardsParams;
  bass: BassParams;
  linear: LinearParams;
}

export interface Scenario {
  id: string;
  name: string;
  color: string;
  model: ModelType;
  coreSnapshot: Pick<CoreParams, "ceilingPct" | "launchLag">;
  paramsSnapshot: LogisticParams | GompertzParams | RichardsParams | BassParams | LinearParams;
}

export interface CurvePoint {
  period: number;
  label: string;
  cumulativePct: number;
  incrementalPct: number;
  cumulativeVolume: number | null;
  incrementalVolume: number | null;
}

export interface Milestones {
  reach10: number | null;
  reach50: number | null;
  reach90: number | null;
  peakGrowthPct: number;
  peakGrowthAt: number;
  peakAt: number | null;
  ceilingPct: number;
}

export interface FitMetrics {
  r2: number;
  rmse: number;
  mape: number;
}

export interface FitResult {
  model: ModelType;
  params: Record<string, number>;
  metrics: FitMetrics;
  loss: number;
}

export interface ObservedPoint {
  period: number;
  adoptionPct: number;
}

export interface TargetPoint {
  period: number;
  adoptionPct: number;
}

export interface FitState {
  rawInput: string;
  data: ObservedPoint[];
  error: string | null;
  fitResults: Partial<Record<ModelType, FitResult>>;
  stagedFit: FitResult | null;
  isFitting: boolean;
  targetInput: string;
  targets: TargetPoint[];
}

export interface TableSortState {
  key: string;
  dir: "asc" | "desc";
}

export interface AppState {
  activeModel: ModelType;
  core: CoreParams;
  params: ModelParams;
  editingScenarioId: string | null;
  leftTab: LeftTab;
  rightTab: RightTab;
  chartMode: ChartMode;
  bassView: BassView;
  scenarios: Scenario[];
  fit: FitState;
  tableSort: TableSortState;
  aboutCollapsed: boolean;
  toast: string | null;
  theme: ThemeMode;
}

export interface ComputedSeries {
  points: CurvePoint[];
  cumulativePct: number[];
  incrementalPct: number[];
}

export interface ShareableState {
  activeModel: ModelType;
  core: CoreParams;
  params: ModelParams;
  editingScenarioId: string | null;
  rightTab: RightTab;
  leftTab: LeftTab;
  chartMode: ChartMode;
  bassView: BassView;
  scenarios: Scenario[];
  theme: ThemeMode;
}
