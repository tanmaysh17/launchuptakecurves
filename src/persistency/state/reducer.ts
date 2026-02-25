import type { PersistencyState, PersistencyAction, ModelParams } from "../types";

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

export const initialState: PersistencyState = {
  activeModel: "weibull",
  params: defaultParams,
  horizon: 36,
  leftTab: "parameters",
  chartView: "survival",
  theme: "dark",
  toast: null,
  activePresetId: null,
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

export function reducer(state: PersistencyState, action: PersistencyAction): PersistencyState {
  switch (action.type) {
    case "setActiveModel":
      return { ...state, activeModel: action.model };

    case "setWeibullParam":
      return { ...state, activePresetId: null, params: { ...state.params, weibull: { ...state.params.weibull, [action.key]: action.value } } };

    case "setExponentialParam":
      return { ...state, activePresetId: null, params: { ...state.params, exponential: { ...state.params.exponential, [action.key]: action.value } } };

    case "setLogNormalParam":
      return { ...state, activePresetId: null, params: { ...state.params, logNormal: { ...state.params.logNormal, [action.key]: action.value } } };

    case "setPiecewiseKnots":
      return { ...state, activePresetId: null, params: { ...state.params, piecewise: { knots: action.knots } } };

    case "setMixtureCureParam":
      return { ...state, activePresetId: null, params: { ...state.params, mixtureCure: { ...state.params.mixtureCure, [action.key]: action.value } } };

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

    default:
      return state;
  }
}
