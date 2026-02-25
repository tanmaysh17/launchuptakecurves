import { useEffect, useMemo, useReducer } from "react";
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
import { PresetSelector } from "./components/controls/PresetSelector";
import { WeibullControls } from "./components/controls/WeibullControls";
import { ExponentialControls } from "./components/controls/ExponentialControls";
import { LogNormalControls } from "./components/controls/LogNormalControls";
import { PiecewiseControls } from "./components/controls/PiecewiseControls";
import { MixtureCureControls } from "./components/controls/MixtureCureControls";
import { PersistencyChart } from "./components/chart/PersistencyChart";
import { HazardChart } from "./components/chart/HazardChart";
import { MetricsPanel } from "./components/MetricsPanel";
import { CohortPanel } from "./components/CohortPanel";
import { FitPanel } from "./components/FitPanel";
import { ExportPanel } from "./components/ExportPanel";
import { BenchmarkToggles, getEnabledBenchmarkSeries } from "./components/BenchmarkToggles";
import type { CurveModel, LeftTab, ThemeMode, CohortMonth, FittableCurveModel } from "./types";

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

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

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

  const renderModelControls = () => {
    switch (state.activeModel) {
      case "weibull":
        return (
          <WeibullControls
            params={state.params.weibull}
            onChange={(key, value) => dispatch({ type: "setWeibullParam", key, value })}
          />
        );
      case "exponential":
        return (
          <ExponentialControls
            params={state.params.exponential}
            onChange={(key, value) => dispatch({ type: "setExponentialParam", key, value })}
          />
        );
      case "logNormal":
        return (
          <LogNormalControls
            params={state.params.logNormal}
            onChange={(key, value) => dispatch({ type: "setLogNormalParam", key, value })}
          />
        );
      case "piecewise":
        return (
          <PiecewiseControls
            knots={state.params.piecewise.knots}
            onChange={(knots) => dispatch({ type: "setPiecewiseKnots", knots })}
          />
        );
      case "mixtureCure":
        return (
          <MixtureCureControls
            params={state.params.mixtureCure}
            onChange={(key, value) => dispatch({ type: "setMixtureCureParam", key, value })}
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
            <button
              onClick={() => dispatch({ type: "setExportOpen", value: true })}
              className="rounded border border-app-border px-3 py-1.5 font-chrome text-[11px] uppercase tracking-[0.08em] text-app-text hover:border-app-accent hover:text-app-accent"
            >
              Export
            </button>
          }
        />
        <div className="mb-4">
          <p className="text-sm text-app-muted">
            Design patient persistency curves, compute business metrics, simulate cohorts, and fit KM data.
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid gap-4 md:grid-cols-[minmax(320px,30%)_minmax(0,70%)]">
          {/* Left Panel */}
          <aside className="rounded-panel border border-app-border bg-app-elevated p-3 md:p-4 animate-fadeUp">
            <PresetSelector
              activePresetId={state.activePresetId}
              onSelect={(preset) => {
                dispatch({ type: "loadPreset", preset });
                dispatch({ type: "setToast", value: `Loaded preset: ${preset.label}` });
              }}
            />

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
              </div>

              {/* Right Sidebar */}
              <aside className="space-y-3">
                <div className="rounded-panel border border-app-border bg-app-surface p-3">
                  <MetricsPanel
                    metrics={metrics}
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
