import { applyFitToState } from "../lib/fitting/fitModels";
import { DEFAULT_CORE, DEFAULT_PARAMS, SCENARIO_COLORS } from "../lib/models";
import { readShareStateFromUrl } from "../lib/shareState";
import type { AppState, BassView, ChartMode, FitResult, LeftTab, ModelType, RightTab, Scenario, TableSortState, ThemeMode } from "../types";

export type Action =
  | { type: "setActiveModel"; model: ModelType }
  | { type: "selectScenario"; id: string | null }
  | { type: "setScenarioModel"; id: string; model: ModelType }
  | { type: "setScenarioCoreParam"; id: string; key: "ceilingPct" | "launchLag"; value: number }
  | { type: "setScenarioModelParam"; id: string; key: string; value: number }
  | { type: "setLeftTab"; tab: LeftTab }
  | { type: "setRightTab"; tab: RightTab }
  | { type: "setChartMode"; mode: ChartMode }
  | { type: "setBassView"; view: BassView }
  | { type: "setCoreParam"; key: keyof AppState["core"]; value: number | string | null }
  | { type: "setModelParam"; model: ModelType; key: string; value: number }
  | { type: "addScenario" }
  | { type: "renameScenario"; id: string; name: string }
  | { type: "clearScenarios" }
  | { type: "setTableSort"; sort: TableSortState }
  | { type: "toggleAbout" }
  | { type: "setToast"; value: string | null }
  | { type: "setFitRawInput"; value: string }
  | { type: "setFitData"; data: AppState["fit"]["data"]; error: string | null }
  | { type: "setFitRunning"; value: boolean }
  | { type: "setFitResults"; results: Partial<Record<ModelType, FitResult>> }
  | { type: "setStagedFit"; result: FitResult | null }
  | { type: "applyStagedFit" }
  | { type: "setTheme"; theme: ThemeMode };

function defaultState(): AppState {
  return {
    activeModel: "richards",
    core: { ...DEFAULT_CORE },
    params: {
      logistic: { ...DEFAULT_PARAMS.logistic },
      gompertz: { ...DEFAULT_PARAMS.gompertz },
      richards: { ...DEFAULT_PARAMS.richards },
      bass: { ...DEFAULT_PARAMS.bass },
      linear: { ...DEFAULT_PARAMS.linear }
    },
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
      isFitting: false
    },
    tableSort: { key: "period", dir: "asc" },
    aboutCollapsed: false,
    toast: null,
    theme: "dark"
  };
}

function snapshotScenario(state: AppState, color: string, index: number): Scenario {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `scenario-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    name: `Scenario ${String.fromCharCode(65 + index)}`,
    color,
    model: state.activeModel,
    coreSnapshot: {
      ceilingPct: state.core.ceilingPct,
      launchLag: state.core.launchLag
    },
    paramsSnapshot: { ...state.params[state.activeModel] }
  };
}

function hydratedState(): AppState {
  const base = defaultState();
  const shared = readShareStateFromUrl();
  if (!shared) {
    return base;
  }
  return {
    ...base,
    activeModel: shared.activeModel ?? base.activeModel,
    core: {
      ...base.core,
      ...shared.core
    },
    params: {
      logistic: { ...base.params.logistic, ...shared.params.logistic },
      gompertz: { ...base.params.gompertz, ...shared.params.gompertz },
      richards: { ...base.params.richards, ...shared.params.richards },
      bass: { ...base.params.bass, ...shared.params.bass },
      linear: { ...base.params.linear, ...shared.params.linear }
    },
    rightTab: shared.rightTab ?? base.rightTab,
    leftTab: shared.leftTab ?? base.leftTab,
    chartMode: shared.chartMode ?? base.chartMode,
    bassView: shared.bassView ?? base.bassView,
    scenarios: Array.isArray(shared.scenarios) ? shared.scenarios.slice(0, 4) : base.scenarios,
    editingScenarioId: shared.editingScenarioId ?? null,
    theme: base.theme
  };
}

export const initialAppState = hydratedState();

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "setActiveModel":
      return { ...state, activeModel: action.model };
    case "selectScenario":
      if (!action.id) {
        return { ...state, editingScenarioId: null };
      }
      const selected = state.scenarios.find((s) => s.id === action.id);
      return {
        ...state,
        editingScenarioId: action.id,
        activeModel: selected?.model ?? state.activeModel
      };
    case "setScenarioModel":
      return {
        ...state,
        activeModel: action.model,
        scenarios: state.scenarios.map((s) =>
          s.id === action.id
            ? {
                ...s,
                model: action.model,
                paramsSnapshot: { ...state.params[action.model] }
              }
            : s
        )
      };
    case "setScenarioCoreParam":
      return {
        ...state,
        scenarios: state.scenarios.map((s) =>
          s.id === action.id
            ? {
                ...s,
                coreSnapshot: {
                  ...s.coreSnapshot,
                  [action.key]: action.value
                }
              }
            : s
        )
      };
    case "setScenarioModelParam":
      return {
        ...state,
        scenarios: state.scenarios.map((s) =>
          s.id === action.id
            ? (() => {
                const nextParams = { ...(s.paramsSnapshot as unknown as Record<string, number>) };
                nextParams[action.key] = action.value;
                return {
                  ...s,
                  paramsSnapshot: nextParams as unknown as Scenario["paramsSnapshot"]
                };
              })()
            : s
        )
      };
    case "setLeftTab":
      return { ...state, leftTab: action.tab };
    case "setRightTab":
      return { ...state, rightTab: action.tab };
    case "setChartMode":
      return { ...state, chartMode: action.mode };
    case "setBassView":
      return { ...state, bassView: action.view };
    case "setCoreParam":
      return {
        ...state,
        core: {
          ...state.core,
          [action.key]: action.value
        } as AppState["core"]
      };
    case "setModelParam":
      return {
        ...state,
        params: {
          ...state.params,
          [action.model]: {
            ...state.params[action.model],
            [action.key]: action.value
          }
        } as AppState["params"]
      };
    case "addScenario":
      if (state.scenarios.length >= 4) {
        return { ...state, toast: "Maximum of 4 scenarios reached." };
      }
      const newScenario = snapshotScenario(state, SCENARIO_COLORS[state.scenarios.length], state.scenarios.length);
      return {
        ...state,
        scenarios: [...state.scenarios, newScenario],
        editingScenarioId: newScenario.id,
        activeModel: newScenario.model
      };
    case "renameScenario":
      return {
        ...state,
        scenarios: state.scenarios.map((s) => (s.id === action.id ? { ...s, name: action.name } : s))
      };
    case "clearScenarios":
      return {
        ...state,
        scenarios: [],
        editingScenarioId: null
      };
    case "setTableSort":
      return { ...state, tableSort: action.sort };
    case "toggleAbout":
      return { ...state, aboutCollapsed: !state.aboutCollapsed };
    case "setToast":
      return { ...state, toast: action.value };
    case "setFitRawInput":
      return { ...state, fit: { ...state.fit, rawInput: action.value } };
    case "setFitData":
      return { ...state, fit: { ...state.fit, data: action.data, error: action.error } };
    case "setFitRunning":
      return { ...state, fit: { ...state.fit, isFitting: action.value } };
    case "setFitResults":
      return { ...state, fit: { ...state.fit, fitResults: action.results } };
    case "setStagedFit":
      return { ...state, fit: { ...state.fit, stagedFit: action.result } };
    case "applyStagedFit":
      if (!state.fit.stagedFit) {
        return state;
      }
      return applyFitToState(state, state.fit.stagedFit);
    case "setTheme":
      return { ...state, theme: "dark" };
    default:
      return state;
  }
}
