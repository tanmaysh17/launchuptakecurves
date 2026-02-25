import type { PersistencyState, PersistencyAction, ModelParams, ShareablePersistencyState } from "../types";
import { readStoredTheme } from "../../lib/theme";

export const SCENARIO_COLORS = ["#00d4b4", "#f0a500", "#a78bfa", "#ff6b9a"];
const MAX_SCENARIOS = 4;

const defaultParams: ModelParams = {
  weibull: { lambda: 8, k: 0.7, ceiling: 100 },
  exponential: { lambda: 0.1, ceiling: 100 },
  logNormal: { medianMonths: 12, sigma: 0.8, ceiling: 100 },
  piecewise: {
    knots: [
      { month: 0, survival: 100 },
      { month: 6, survival: 70 },
      { month: 12, survival: 45 },
      { month: 18, survival: 25 },
      { month: 24, survival: 15 }
    ]
  },
  mixtureCure: { pi: 0.25, lambda: 8, k: 1.0 }
};

function defaultState(): PersistencyState {
  return {
    activeModel: "weibull",
    params: defaultParams,
    horizon: 36,
    leftTab: "parameters",
    chartView: "survival",
    theme: readStoredTheme() ?? "dark",
    toast: null,
    activePresetId: null,
    scenarios: [],
    editingScenarioId: null,
    benchmarks: [],
    kmRawInput: "",
    kmData: [],
    kmError: null,
    kmFitting: false,
    kmFitResults: {},
    kmStagedFit: null,
    targetInput: "",
    targets: [],
    cohortExpanded: false,
    cohortNewStarts: 100,
    cohortMonths: 24,
    monthlyDose: 1,
    exportOpen: false
  };
}

// Hydrate from localStorage if available
function hydratedState(): PersistencyState {
  const base = defaultState();
  try {
    const raw = localStorage.getItem("persistency-state");
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<ShareablePersistencyState>;
    if (!saved || typeof saved !== "object") return base;
    return {
      ...base,
      activeModel: saved.activeModel ?? base.activeModel,
      params: saved.params ? { ...base.params, ...saved.params } : base.params,
      horizon: saved.horizon ?? base.horizon,
      chartView: saved.chartView ?? base.chartView,
      scenarios: Array.isArray(saved.scenarios) ? saved.scenarios.slice(0, MAX_SCENARIOS) : [],
      editingScenarioId: saved.editingScenarioId ?? null,
      benchmarks: Array.isArray(saved.benchmarks) ? saved.benchmarks : [],
      cohortNewStarts: saved.cohortNewStarts ?? base.cohortNewStarts,
      cohortMonths: saved.cohortMonths ?? base.cohortMonths,
      monthlyDose: saved.monthlyDose ?? base.monthlyDose,
    };
  } catch {
    return base;
  }
}

export const initialState: PersistencyState = hydratedState();

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Helper: update the editing scenario's paramsSnapshot when params change
function syncEditingScenario(state: PersistencyState, model: string): PersistencyState {
  if (!state.editingScenarioId) return state;
  const idx = state.scenarios.findIndex((s) => s.id === state.editingScenarioId);
  if (idx < 0 || state.scenarios[idx].model !== model) return state;
  const updated = [...state.scenarios];
  updated[idx] = { ...updated[idx], paramsSnapshot: JSON.parse(JSON.stringify(state.params[model as keyof ModelParams])) };
  return { ...state, scenarios: updated };
}

export function reducer(state: PersistencyState, action: PersistencyAction): PersistencyState {
  switch (action.type) {
    case "setActiveModel":
      return { ...state, activeModel: action.model };

    case "setWeibullParam": {
      const next = { ...state, activePresetId: null, params: { ...state.params, weibull: { ...state.params.weibull, [action.key]: action.value } } };
      return syncEditingScenario(next, "weibull");
    }

    case "setExponentialParam": {
      const next = { ...state, activePresetId: null, params: { ...state.params, exponential: { ...state.params.exponential, [action.key]: action.value } } };
      return syncEditingScenario(next, "exponential");
    }

    case "setLogNormalParam": {
      const next = { ...state, activePresetId: null, params: { ...state.params, logNormal: { ...state.params.logNormal, [action.key]: action.value } } };
      return syncEditingScenario(next, "logNormal");
    }

    case "setPiecewiseKnots": {
      const next = { ...state, activePresetId: null, params: { ...state.params, piecewise: { knots: action.knots } } };
      return syncEditingScenario(next, "piecewise");
    }

    case "setMixtureCureParam": {
      const next = { ...state, activePresetId: null, params: { ...state.params, mixtureCure: { ...state.params.mixtureCure, [action.key]: action.value } } };
      return syncEditingScenario(next, "mixtureCure");
    }

    case "setHorizon":
      return { ...state, horizon: action.value };

    case "setLeftTab":
      return { ...state, leftTab: action.tab };

    case "setChartView":
      return { ...state, chartView: action.view };

    case "setTheme":
      return { ...state, theme: action.theme };

    case "setToast":
      return { ...state, toast: action.value };

    case "toggleBenchmark": {
      const exists = state.benchmarks.find((b) => b.id === action.id);
      if (exists) {
        return {
          ...state,
          benchmarks: state.benchmarks.map((b) => (b.id === action.id ? { ...b, enabled: !b.enabled } : b))
        };
      }
      return { ...state, benchmarks: [...state.benchmarks, { id: action.id, enabled: true }] };
    }

    case "setKMRawInput":
      return { ...state, kmRawInput: action.value };

    case "setKMData":
      return { ...state, kmData: action.data, kmError: action.error };

    case "setKMFitting":
      return { ...state, kmFitting: action.value };

    case "setKMFitResults":
      return { ...state, kmFitResults: action.results };

    case "setKMStagedFit":
      return { ...state, kmStagedFit: action.result };

    case "applyFitResult": {
      const staged = state.kmStagedFit;
      if (!staged) return state;
      const { model, params } = staged;
      const newParams = { ...state.params };
      switch (model) {
        case "weibull":
          newParams.weibull = params as ModelParams["weibull"];
          break;
        case "exponential":
          newParams.exponential = params as ModelParams["exponential"];
          break;
        case "logNormal":
          newParams.logNormal = params as ModelParams["logNormal"];
          break;
        case "mixtureCure":
          newParams.mixtureCure = params as ModelParams["mixtureCure"];
          break;
      }
      return { ...state, activeModel: model, params: newParams, activePresetId: null };
    }

    case "loadPreset": {
      const { model, params } = action.preset;
      const newParams = { ...state.params };
      switch (model) {
        case "weibull":
          newParams.weibull = params as ModelParams["weibull"];
          break;
        case "exponential":
          newParams.exponential = params as ModelParams["exponential"];
          break;
        case "logNormal":
          newParams.logNormal = params as ModelParams["logNormal"];
          break;
        case "piecewise":
          newParams.piecewise = params as ModelParams["piecewise"];
          break;
        case "mixtureCure":
          newParams.mixtureCure = params as ModelParams["mixtureCure"];
          break;
      }
      return { ...state, activeModel: model, params: newParams, activePresetId: action.preset.id };
    }

    case "setTargetInput":
      return { ...state, targetInput: action.value };

    case "setTargets":
      return { ...state, targets: action.targets };

    case "setCohortExpanded":
      return { ...state, cohortExpanded: action.value };

    case "setCohortNewStarts":
      return { ...state, cohortNewStarts: action.value };

    case "setCohortMonths":
      return { ...state, cohortMonths: action.value };

    case "setMonthlyDose":
      return { ...state, monthlyDose: action.value };

    case "setExportOpen":
      return { ...state, exportOpen: action.value };

    // --- Scenario actions ---
    case "addScenario": {
      if (state.scenarios.length >= MAX_SCENARIOS) return state;
      const snapshot = state.params[state.activeModel];
      const newScenario = {
        id: generateId(),
        name: `Scenario ${String.fromCharCode(65 + state.scenarios.length)}`,
        color: SCENARIO_COLORS[state.scenarios.length % SCENARIO_COLORS.length],
        model: state.activeModel,
        paramsSnapshot: JSON.parse(JSON.stringify(snapshot)),
      };
      return {
        ...state,
        scenarios: [...state.scenarios, newScenario],
        editingScenarioId: newScenario.id,
      };
    }

    case "removeScenario":
      return {
        ...state,
        scenarios: state.scenarios.filter((s) => s.id !== action.id),
        editingScenarioId: state.editingScenarioId === action.id ? null : state.editingScenarioId,
      };

    case "clearScenarios":
      return { ...state, scenarios: [], editingScenarioId: null };

    case "renameScenario":
      return {
        ...state,
        scenarios: state.scenarios.map((s) => s.id === action.id ? { ...s, name: action.name } : s),
      };

    case "selectScenario": {
      if (action.id === null) return { ...state, editingScenarioId: null };
      const scenario = state.scenarios.find((s) => s.id === action.id);
      if (!scenario) return state;
      // Switch active model to match the selected scenario
      return { ...state, editingScenarioId: action.id, activeModel: scenario.model };
    }

    // --- Session restore ---
    case "loadSession": {
      const s = action.session;
      return {
        ...state,
        activeModel: s.activeModel,
        params: s.params ? { ...defaultParams, ...s.params } : state.params,
        horizon: s.horizon ?? state.horizon,
        chartView: s.chartView ?? state.chartView,
        theme: s.theme ?? state.theme,
        scenarios: Array.isArray(s.scenarios) ? s.scenarios.slice(0, MAX_SCENARIOS) : state.scenarios,
        editingScenarioId: s.editingScenarioId ?? null,
        benchmarks: Array.isArray(s.benchmarks) ? s.benchmarks : state.benchmarks,
        cohortNewStarts: s.cohortNewStarts ?? state.cohortNewStarts,
        cohortMonths: s.cohortMonths ?? state.cohortMonths,
        monthlyDose: s.monthlyDose ?? state.monthlyDose,
        activePresetId: null,
      };
    }

    default:
      return state;
  }
}
