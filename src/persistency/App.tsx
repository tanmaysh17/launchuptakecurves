import { useEffect, useMemo, useReducer, useRef } from "react";
import { AppNav } from "../components/ui/AppNav";
import { PillTabs } from "../components/ui/PillTabs";
import { Toast } from "../components/ui/Toast";
import { ParameterSlider } from "../components/ui/ParameterSlider";
import { SectionLabel } from "../components/ui/SectionLabel";
import { applyTheme, persistTheme } from "../lib/theme";
import { initialState, reducer } from "./state/reducer";
import { computeSeries } from "./lib/curves";
import { computeMetrics } from "./lib/metrics";
import { simulateCohort } from "./lib/cohort";
import { fitAllModelsAsMap, bestFitFromMap, parseKMData, targetsToKMData } from "./lib/fitting";
import { autoSaveState, readShareStateFromUrl } from "./lib/sessions";
import { PresetSelector } from "./components/controls/PresetSelector";
import { WeibullControls } from "./components/controls/WeibullControls";
import { ExponentialControls } from "./components/controls/ExponentialControls";
import { LogNormalControls } from "./components/controls/LogNormalControls";
import { PiecewiseControls } from "./components/controls/PiecewiseControls";
import { MixtureCureControls } from "./components/controls/MixtureCureControls";
import { PersistencyScenarioControls } from "./components/controls/PersistencyScenarioControls";
import { PersistencyChart, type ScenarioChartSeries } from "./components/chart/PersistencyChart";
import { HazardChart } from "./components/chart/HazardChart";
import { MetricsPanel } from "./components/MetricsPanel";
import { CohortPanel } from "./components/CohortPanel";
import { ModelGuide } from "./components/ModelGuide";
import { FitPanel } from "./components/FitPanel";
import { ExportPanel } from "./components/ExportPanel";
import { SessionManager } from "./components/SessionManager";
import { BenchmarkToggles, getEnabledBenchmarkSeries } from "./components/BenchmarkToggles";
import { PersistencyBrandLogo } from "./components/ui/PersistencyBrandLogo";
import type { CurveModel, LeftTab, ThemeMode, CohortMonth, FittableCurveModel, ShareablePersistencyState } from "./types";

const MODEL_TABS: { key: CurveModel; label: string }[] = [
  { key: "weibull", label: "Weibull" },
  { key: "exponential", label: "Exponential" },
  { key: "logNormal", label: "Log-Normal" },
  { key: "piecewise", label: "Piecewise" },
  { key: "mixtureCure", label: "Mixture Cure" }
];

const MODEL_LABELS: Record<FittableCurveModel, string> = {
  weibull: "Weibull",
  exponential: "Exponential",
  logNormal: "Log-Normal",
  mixtureCure: "Mixture Cure"
};

function toShareable(state: typeof initialState): ShareablePersistencyState {
  return {
    activeModel: state.activeModel,
    params: state.params,
    horizon: state.horizon,
    chartView: state.chartView,
    theme: state.theme,
    scenarios: state.scenarios,
    editingScenarioId: state.editingScenarioId,
    benchmarks: state.benchmarks,
    cohortNewStarts: state.cohortNewStarts,
    cohortMonths: state.cohortMonths,
    monthlyDose: state.monthlyDose,
  };
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate from URL on first load
  useEffect(() => {
    const shared = readShareStateFromUrl();
    if (shared) {
      dispatch({ type: "loadSession", session: shared });
    }
  }, []);

  // Auto-save to localStorage on meaningful state changes (debounced)
  const saveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      autoSaveState(toShareable(state));
    }, 400);
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
  }, [state.activeModel, state.params, state.horizon, state.chartView, state.scenarios, state.editingScenarioId, state.benchmarks, state.cohortNewStarts, state.cohortMonths, state.monthlyDose]);

  const series = useMemo(
    () => computeSeries(state.activeModel, state.params, state.horizon),
    [state.activeModel, state.params, state.horizon]
  );

  const metrics = useMemo(
    () => computeMetrics(series, state.monthlyDose),
    [series, state.monthlyDose]
  );

  const benchmarkSeries = useMemo(
    () => getEnabledBenchmarkSeries(state.benchmarks, state.horizon),
    [state.benchmarks, state.horizon]
  );

  // Compute scenario series for chart overlay
  const scenarioSeries = useMemo<ScenarioChartSeries[]>(() => {
    return state.scenarios.map((sc) => {
      // Build a temporary params object with the scenario's snapshot
      const tempParams = { ...state.params };
      switch (sc.model) {
        case "weibull": tempParams.weibull = sc.paramsSnapshot as typeof tempParams.weibull; break;
        case "exponential": tempParams.exponential = sc.paramsSnapshot as typeof tempParams.exponential; break;
        case "logNormal": tempParams.logNormal = sc.paramsSnapshot as typeof tempParams.logNormal; break;
        case "piecewise": tempParams.piecewise = sc.paramsSnapshot as typeof tempParams.piecewise; break;
        case "mixtureCure": tempParams.mixtureCure = sc.paramsSnapshot as typeof tempParams.mixtureCure; break;
      }
      return {
        id: sc.id,
        name: sc.name,
        color: sc.color,
        series: computeSeries(sc.model, tempParams, state.horizon),
      };
    });
  }, [state.scenarios, state.params, state.horizon]);

  // Compute metrics for each scenario (for the comparison table)
  const scenarioMetrics = useMemo(
    () => scenarioSeries.map((sc) => ({
      name: sc.name,
      color: sc.color,
      metrics: computeMetrics(sc.series, state.monthlyDose),
    })),
    [scenarioSeries, state.monthlyDose]
  );

  const cohortData = useMemo<CohortMonth[]>(
    () => (state.cohortExpanded ? simulateCohort(state.activeModel, state.params, state.cohortNewStarts, state.cohortMonths) : []),
    [state.cohortExpanded, state.activeModel, state.params, state.cohortNewStarts, state.cohortMonths]
  );

  // Parse KM input
  useEffect(() => {
    const { data, error } = parseKMData(state.kmRawInput);
    dispatch({ type: "setKMData", data, error });
  }, [state.kmRawInput]);

  // Auto-fit when KM data changes
  useEffect(() => {
    if (!state.kmData.length) {
      dispatch({ type: "setKMFitResults", results: {} });
      dispatch({ type: "setKMStagedFit", result: null });
      return;
    }
    dispatch({ type: "setKMFitting", value: true });
    const timer = window.setTimeout(() => {
      const map = fitAllModelsAsMap(state.kmData);
      dispatch({ type: "setKMFitResults", results: map });
      const best = bestFitFromMap(map);
      dispatch({ type: "setKMStagedFit", result: best });
      dispatch({ type: "setKMFitting", value: false });
    }, 10);
    return () => window.clearTimeout(timer);
  }, [state.kmData]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!state.toast) return;
    const timer = window.setTimeout(() => dispatch({ type: "setToast", value: null }), 2400);
    return () => window.clearTimeout(timer);
  }, [state.toast]);

  // Theme
  useEffect(() => {
    applyTheme(state.theme);
    persistTheme(state.theme);
  }, [state.theme]);

  const toggleTheme = () => {
    const next: ThemeMode = state.theme === "light" ? "dark" : "light";
    dispatch({ type: "setTheme", theme: next });
  };

  const handleAutoFit = () => {
    if (state.kmData.length < 2) return;
    dispatch({ type: "setKMFitting", value: true });
    setTimeout(() => {
      const map = fitAllModelsAsMap(state.kmData);
      dispatch({ type: "setKMFitResults", results: map });
      const best = bestFitFromMap(map);
      dispatch({ type: "setKMStagedFit", result: best });
      dispatch({ type: "setKMFitting", value: false });
      dispatch({
        type: "setToast",
        value: best
          ? `Best fit: ${MODEL_LABELS[best.model as FittableCurveModel]} (R²=${best.r2.toFixed(4)})`
          : "Fitting did not converge."
      });
    }, 10);
  };

  const handleApplyFit = () => {
    dispatch({ type: "applyFitResult" });
    dispatch({ type: "setToast", value: "Fitted parameters applied." });
  };

  const handleFitTargets = () => {
    if (state.targets.length < 2) return;
    dispatch({ type: "setKMFitting", value: true });
    const targetData = targetsToKMData(state.targets);
    setTimeout(() => {
      const map = fitAllModelsAsMap(targetData);
      dispatch({ type: "setKMFitResults", results: map });
      const best = bestFitFromMap(map);
      dispatch({ type: "setKMStagedFit", result: best });
      if (best) {
        dispatch({ type: "setActiveModel", model: best.model });
      }
      dispatch({ type: "setKMFitting", value: false });
      dispatch({
        type: "setToast",
        value: best
          ? `Target fit: ${MODEL_LABELS[best.model as FittableCurveModel]} staged (R²=${best.r2.toFixed(4)})`
          : "Fit did not produce a valid result."
      });
    }, 10);
  };

  // When editing a scenario, parameter changes should update the scenario snapshot
  const editingScenario = state.scenarios.find((s) => s.id === state.editingScenarioId) ?? null;

  const renderModelControls = () => {
    switch (state.activeModel) {
      case "weibull":
        return (
          <WeibullControls
            params={state.params.weibull}
            onChange={(key, value) => {
              dispatch({ type: "setWeibullParam", key, value });
            }}
          />
        );
      case "exponential":
        return (
          <ExponentialControls
            params={state.params.exponential}
            onChange={(key, value) => {
              dispatch({ type: "setExponentialParam", key, value });
            }}
          />
        );
      case "logNormal":
        return (
          <LogNormalControls
            params={state.params.logNormal}
            onChange={(key, value) => {
              dispatch({ type: "setLogNormalParam", key, value });
            }}
          />
        );
      case "piecewise":
        return (
          <PiecewiseControls
            knots={state.params.piecewise.knots}
            onChange={(knots) => {
              dispatch({ type: "setPiecewiseKnots", knots });
            }}
          />
        );
      case "mixtureCure":
        return (
          <MixtureCureControls
            params={state.params.mixtureCure}
            onChange={(key, value) => {
              dispatch({ type: "setMixtureCureParam", key, value });
            }}
          />
        );
    }
  };

  return (
    <div className="app-shell min-h-screen bg-app-bg text-app-text" data-theme={state.theme}>
      <div className="mx-auto max-w-[1600px] p-4 md:p-5">
        {/* Header */}
        <AppNav
          active="persistency"
          theme={state.theme}
          onToggleTheme={toggleTheme}
          rightActions={
            <div className="flex items-center gap-2">
              <SessionManager
                state={toShareable(state)}
                onLoadSession={(session) => dispatch({ type: "loadSession", session })}
                onToast={(msg) => dispatch({ type: "setToast", value: msg })}
              />
              <button
                onClick={() => dispatch({ type: "setExportOpen", value: true })}
                className="rounded border border-app-border px-3 py-1.5 font-chrome text-[11px] uppercase tracking-[0.08em] text-app-text hover:border-app-accent hover:text-app-accent"
              >
                Export
              </button>
            </div>
          }
        />
        <div className="mb-4 flex items-center gap-3">
          <PersistencyBrandLogo />
          <p className="text-sm text-app-muted">
            Design patient persistency curves, compute business metrics, simulate cohorts, and fit KM data.
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid gap-4 md:grid-cols-[minmax(320px,30%)_minmax(0,70%)]">
          {/* Left Panel */}
          <aside className="rounded-panel border border-app-border bg-app-elevated p-3 md:p-4 animate-fadeUp">
            {/* Scenario Comparison */}
            <PersistencyScenarioControls
              scenarios={state.scenarios}
              selectedScenarioId={state.editingScenarioId}
              onAdd={() => {
                dispatch({ type: "addScenario" });
                dispatch({ type: "setToast", value: `Scenario snapshot added.` });
              }}
              onClear={() => dispatch({ type: "clearScenarios" })}
              onRemove={(id) => dispatch({ type: "removeScenario", id })}
              onRename={(id, name) => dispatch({ type: "renameScenario", id, name })}
              onSelectScenario={(id) => dispatch({ type: "selectScenario", id })}
            />

            <div className="mt-3">
              <PresetSelector
                activePresetId={state.activePresetId}
                onSelect={(preset) => {
                  dispatch({ type: "loadPreset", preset });
                  dispatch({ type: "setToast", value: `Loaded preset: ${preset.label}` });
                }}
              />
            </div>

            <div className="mt-4">
              <PillTabs<LeftTab>
                value={state.leftTab}
                onChange={(tab) => dispatch({ type: "setLeftTab", tab })}
                options={[
                  { key: "parameters", label: "Parameters" },
                  { key: "fit", label: "Fit To Data" }
                ]}
              />
            </div>

            <div className="mt-4 space-y-4">
              {state.leftTab === "parameters" ? (
                <>
                  <div>
                    <SectionLabel>Model</SectionLabel>
                    <PillTabs<CurveModel>
                      value={state.activeModel}
                      onChange={(model) => dispatch({ type: "setActiveModel", model })}
                      options={MODEL_TABS}
                      fullWidth
                    />
                  </div>

                  {editingScenario && (
                    <div className="rounded border border-app-accent/30 bg-[rgb(var(--app-accent)/0.06)] px-3 py-2">
                      <p className="font-chrome text-[10px] uppercase tracking-[0.08em] text-app-accent">
                        Editing: {editingScenario.name}
                      </p>
                      <p className="text-[11px] text-app-muted mt-0.5">
                        Changes update this scenario's snapshot. Click "Done" to stop editing.
                      </p>
                    </div>
                  )}

                  <div>
                    <SectionLabel>Parameters</SectionLabel>
                    {renderModelControls()}
                  </div>

                  <ParameterSlider
                    id="horizon"
                    label="Horizon (months)"
                    value={state.horizon}
                    min={6}
                    max={72}
                    step={1}
                    onChange={(v) => dispatch({ type: "setHorizon", value: v })}
                    hint="Maximum time horizon for the survival curve."
                    formatter={(v) => `${v.toFixed(0)} mo`}
                  />
                </>
              ) : (
                <FitPanel
                  kmRawInput={state.kmRawInput}
                  kmData={state.kmData}
                  kmError={state.kmError}
                  fitting={state.kmFitting}
                  fitResults={state.kmFitResults}
                  stagedFit={state.kmStagedFit}
                  targetInput={state.targetInput}
                  targets={state.targets}
                  onRawInputChange={(value) => dispatch({ type: "setKMRawInput", value })}
                  onLoadFileText={(text) => dispatch({ type: "setKMRawInput", value: text })}
                  onAutoFit={handleAutoFit}
                  onApplyFit={handleApplyFit}
                  onStageFit={(result) => {
                    dispatch({ type: "setKMStagedFit", result });
                    dispatch({ type: "setActiveModel", model: result.model });
                  }}
                  onTargetInputChange={(value) => dispatch({ type: "setTargetInput", value })}
                  onTargetsChange={(targets) => dispatch({ type: "setTargets", targets })}
                  onFitTargets={handleFitTargets}
                />
              )}
            </div>
          </aside>

          {/* Right Panel */}
          <section className="animate-fadeUp space-y-3">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-3">
                {/* Chart View Toggle */}
                <div className="flex items-center justify-between">
                  <div className="rounded border border-app-border px-2 py-1 font-chrome text-[10px] uppercase tracking-[0.08em] text-app-muted">
                    Active: {MODEL_TABS.find((t) => t.key === state.activeModel)?.label}
                  </div>
                  <PillTabs
                    value={state.chartView}
                    onChange={(view) => dispatch({ type: "setChartView", view })}
                    options={[
                      { key: "survival", label: "Survival" },
                      { key: "hazard", label: "Hazard" }
                    ]}
                  />
                </div>

                {/* Chart */}
                {state.chartView === "survival" ? (
                  <PersistencyChart
                    series={series}
                    kmData={state.kmData}
                    benchmarkSeries={benchmarkSeries}
                    scenarioSeries={scenarioSeries}
                    medianDoT={metrics.medianDoT}
                  />
                ) : (
                  <HazardChart series={series} />
                )}

                {/* Cohort Panel */}
                <CohortPanel
                  expanded={state.cohortExpanded}
                  onToggle={() => dispatch({ type: "setCohortExpanded", value: !state.cohortExpanded })}
                  model={state.activeModel}
                  params={state.params}
                  newStarts={state.cohortNewStarts}
                  simMonths={state.cohortMonths}
                  onSetNewStarts={(v) => dispatch({ type: "setCohortNewStarts", value: v })}
                  onSetSimMonths={(v) => dispatch({ type: "setCohortMonths", value: v })}
                />

                {/* Model Guide */}
                <ModelGuide model={state.activeModel} />
              </div>

              {/* Right Sidebar */}
              <aside className="space-y-3">
                <div className="rounded-panel border border-app-border bg-app-surface p-3">
                  <MetricsPanel
                    metrics={metrics}
                    scenarioMetrics={scenarioMetrics}
                    monthlyDose={state.monthlyDose}
                    onSetMonthlyDose={(v) => dispatch({ type: "setMonthlyDose", value: v })}
                  />
                </div>
                <div className="rounded-panel border border-app-border bg-app-surface p-3">
                  <BenchmarkToggles
                    enabled={state.benchmarks}
                    onToggle={(id) => dispatch({ type: "toggleBenchmark", id })}
                  />
                </div>
              </aside>
            </div>
          </section>
        </div>
      </div>

      {/* Export Modal */}
      <ExportPanel
        open={state.exportOpen}
        onClose={() => dispatch({ type: "setExportOpen", value: false })}
        series={series}
        cohortData={cohortData}
        model={state.activeModel}
        params={state.params}
        onToast={(msg) => dispatch({ type: "setToast", value: msg })}
      />

      {state.toast && <Toast message={state.toast} />}
    </div>
  );
}
