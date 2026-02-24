import { useEffect, useMemo, useReducer } from "react";
import { toBlob } from "html-to-image";
import { ChartPanel } from "./components/chart/ChartPanel";
import { CoreParameters } from "./components/controls/CoreParameters";
import { DisplayControls } from "./components/controls/DisplayControls";
import { ModelParameters } from "./components/controls/ModelParameters";
import { ModelSelector } from "./components/controls/ModelSelector";
import { ScenarioControls } from "./components/controls/ScenarioControls";
import { FitPanel } from "./components/fit/FitPanel";
import { MilestonesPanel } from "./components/MilestonesPanel";
import { ModelAbout } from "./components/ModelAbout";
import { TablePanel } from "./components/table/TablePanel";
import { PillTabs } from "./components/ui/PillTabs";
import { BrandLogo } from "./components/ui/BrandLogo";
import { Toast } from "./components/ui/Toast";
import { parseObservedCsv } from "./lib/csv";
import { bestFitResult, fitComparableModels } from "./lib/fitting/fitModels";
import { deriveMilestones } from "./lib/milestones";
import { computeScenarioSeries, computeSeries, MODEL_LABELS } from "./lib/models";
import { readShareStateFromUrl, toShareableState, writeShareStateToUrl } from "./lib/shareState";
import { applyTheme, persistTheme } from "./lib/theme";
import { initialAppState, reducer } from "./state/reducer";
import type { FitResult, LeftTab, ModelType, ThemeMode } from "./types";

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialAppState);
  const editingScenario = useMemo(
    () => state.scenarios.find((scenario) => scenario.id === state.editingScenarioId) ?? null,
    [state.scenarios, state.editingScenarioId]
  );
  const effectiveModel = editingScenario?.model ?? state.activeModel;
  const effectiveCore = useMemo(
    () => ({
      ...state.core,
      ceilingPct: editingScenario?.coreSnapshot.ceilingPct ?? state.core.ceilingPct,
      launchLag: editingScenario?.coreSnapshot.launchLag ?? state.core.launchLag
    }),
    [state.core, editingScenario]
  );
  const effectiveParams = useMemo(() => {
    if (!editingScenario) {
      return state.params;
    }
    const next = { ...state.params };
    if (editingScenario.model === "logistic") {
      next.logistic = editingScenario.paramsSnapshot as typeof next.logistic;
    } else if (editingScenario.model === "gompertz") {
      next.gompertz = editingScenario.paramsSnapshot as typeof next.gompertz;
    } else if (editingScenario.model === "richards") {
      next.richards = editingScenario.paramsSnapshot as typeof next.richards;
    } else if (editingScenario.model === "bass") {
      next.bass = editingScenario.paramsSnapshot as typeof next.bass;
    } else {
      next.linear = editingScenario.paramsSnapshot as typeof next.linear;
    }
    return next;
  }, [state.params, editingScenario]);
  const activeSeries = useMemo(
    () =>
      computeSeries({
        model: effectiveModel,
        core: {
          ceilingPct: effectiveCore.ceilingPct,
          horizon: effectiveCore.horizon,
          launchLag: effectiveCore.launchLag,
          timeUnit: effectiveCore.timeUnit,
          tam: effectiveCore.tam
        },
        params: effectiveParams
      }),
    [effectiveModel, effectiveCore, effectiveParams]
  );

  const milestones = useMemo(
    () => deriveMilestones(activeSeries.cumulativePct, activeSeries.incrementalPct, effectiveCore.ceilingPct),
    [activeSeries.cumulativePct, activeSeries.incrementalPct, effectiveCore.ceilingPct]
  );

  const scenarioSeries = useMemo(() => {
    return computeScenarioSeries(
      state.scenarios,
      {
        horizon: state.core.horizon,
        timeUnit: state.core.timeUnit,
        tam: state.core.tam
      },
      state.params
    ).map(({ scenario, series }) => ({
      id: scenario.id,
      name: scenario.name,
      color: scenario.color,
      ceilingPct: scenario.coreSnapshot.ceilingPct,
      points: series.points
    }));
  }, [state.scenarios, state.core.horizon, state.core.timeUnit, state.core.tam, state.params]);

  const scenarioMilestones = useMemo(
    () =>
      scenarioSeries.map((scenario) => ({
        id: scenario.id,
        name: scenario.name,
        color: scenario.color,
        milestones: deriveMilestones(
          scenario.points.map((p) => p.cumulativePct),
          scenario.points.map((p) => p.incrementalPct),
          scenario.ceilingPct
        )
      })),
    [scenarioSeries]
  );

  useEffect(() => {
    const parsed = parseObservedCsv(state.fit.rawInput);
    dispatch({ type: "setFitData", data: parsed.data, error: parsed.error });
  }, [state.fit.rawInput]);

  useEffect(() => {
    if (!state.fit.data.length) {
      dispatch({ type: "setFitResults", results: {} });
      dispatch({ type: "setStagedFit", result: null });
      return;
    }
    dispatch({ type: "setFitRunning", value: true });
    const timer = window.setTimeout(() => {
      const results = fitComparableModels(state, state.fit.data);
      const map = Object.fromEntries(results.map((result) => [result.model, result])) as Partial<Record<ModelType, FitResult>>;
      dispatch({ type: "setFitResults", results: map });
      dispatch({ type: "setStagedFit", result: map[state.activeModel] ?? bestFitResult(results) ?? null });
      dispatch({ type: "setFitRunning", value: false });
    }, 10);
    return () => window.clearTimeout(timer);
  }, [state.fit.data]);

  useEffect(() => {
    if (!state.toast) {
      return;
    }
    const timer = window.setTimeout(() => dispatch({ type: "setToast", value: null }), 2400);
    return () => window.clearTimeout(timer);
  }, [state.toast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("state") && !readShareStateFromUrl()) {
      dispatch({ type: "setToast", value: "Invalid shared URL state. Loaded defaults instead." });
    }
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) {
      dispatch({ type: "setRightTab", tab: "table" });
    }
  }, []);

  useEffect(() => {
    applyTheme(state.theme);
    persistTheme(state.theme);
  }, [state.theme]);

  const toggleTheme = () => {
    const next: ThemeMode = state.theme === "light" ? "dark" : "light";
    dispatch({ type: "setTheme", theme: next });
  };

  const handleAutoFit = () => {
    if (!state.fit.data.length || state.activeModel === "linear") {
      return;
    }
    dispatch({ type: "setFitRunning", value: true });

    setTimeout(() => {
      const results = fitComparableModels(state, state.fit.data);
      const map = Object.fromEntries(results.map((result) => [result.model, result])) as Partial<Record<ModelType, FitResult>>;
      dispatch({ type: "setFitResults", results: map });
      const staged = map[state.activeModel] ?? bestFitResult(results) ?? null;
      dispatch({ type: "setStagedFit", result: staged });
      if (staged) {
        dispatch({ type: "setActiveModel", model: staged.model });
      }
      dispatch({ type: "setFitRunning", value: false });
      dispatch({
        type: "setToast",
        value: staged ? `Fit complete: ${MODEL_LABELS[staged.model]} staged.` : "Fit did not produce a valid result."
      });
    }, 10);
  };

  const handleApplyFit = () => {
    dispatch({ type: "applyStagedFit" });
    dispatch({ type: "setToast", value: "Fitted parameters applied." });
  };

  const copyChart = async () => {
    const node = document.getElementById("chart-capture");
    if (!node) {
      return;
    }
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue("--app-bg").trim();
    const blob = await toBlob(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: bgColor ? `rgb(${bgColor})` : "rgb(248,250,253)"
    });
    if (!blob) {
      dispatch({ type: "setToast", value: "Unable to create chart image." });
      return;
    }
    try {
      const clipboardItemCtor = (window as unknown as { ClipboardItem?: new (items: Record<string, Blob>) => unknown })
        .ClipboardItem;
      if (navigator.clipboard && clipboardItemCtor) {
        // ClipboardItem support varies; fallback below handles unsupported contexts.
        await (navigator.clipboard as unknown as { write: (items: unknown[]) => Promise<void> }).write([
          new clipboardItemCtor({ "image/png": blob })
        ]);
        dispatch({ type: "setToast", value: "Chart copied to clipboard." });
        return;
      }
    } catch {
      // continue to fallback
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "launch-uptake-chart.png";
    a.click();
    URL.revokeObjectURL(url);
    dispatch({ type: "setToast", value: "Clipboard blocked. Chart downloaded instead." });
  };

  const shareState = async () => {
    const url = writeShareStateToUrl(toShareableState(state));
    try {
      await navigator.clipboard.writeText(url);
      dispatch({ type: "setToast", value: "Share URL copied to clipboard." });
    } catch {
      dispatch({ type: "setToast", value: "Share URL written to address bar." });
    }
  };

  return (
    <div className="app-shell min-h-screen bg-app-bg text-app-text" data-theme={state.theme}>
      <div className="mx-auto max-w-[1600px] p-4 md:p-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <BrandLogo />
            <p className="text-sm text-app-muted">Interactive adoption forecasting with curve fitting, scenarios, and export-ready outputs.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded border border-app-border px-3 py-1.5 font-chrome text-[11px] uppercase tracking-[0.08em] text-app-text hover:border-app-accent hover:text-app-accent"
              title={state.theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {state.theme === "light" ? "Dark" : "Light"}
            </button>
            <a
              href="./readme.html"
              target="_blank"
              rel="noreferrer"
              className="rounded border border-app-border px-3 py-1.5 font-chrome text-[11px] uppercase tracking-[0.08em] text-app-text hover:border-app-accent hover:text-app-accent"
            >
              Readme
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(320px,30%)_minmax(0,70%)]">
          <aside className="rounded-panel border border-app-border bg-app-elevated p-3 md:p-4 animate-fadeUp">
            <ScenarioControls
              scenarios={state.scenarios}
              selectedScenarioId={state.editingScenarioId}
              onAdd={() => dispatch({ type: "addScenario" })}
              onClear={() => dispatch({ type: "clearScenarios" })}
              onRename={(id, name) => dispatch({ type: "renameScenario", id, name })}
              onSelectScenario={(id) => dispatch({ type: "selectScenario", id })}
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
                  <ModelSelector
                    activeModel={effectiveModel}
                    onSelect={(model) =>
                      editingScenario
                        ? dispatch({ type: "setScenarioModel", id: editingScenario.id, model })
                        : dispatch({ type: "setActiveModel", model })
                    }
                  />
                  <CoreParameters
                    core={effectiveCore}
                    onSetCore={(key, value) => {
                      if (editingScenario && (key === "ceilingPct" || key === "launchLag")) {
                        dispatch({ type: "setScenarioCoreParam", id: editingScenario.id, key, value: Number(value) });
                        return;
                      }
                      dispatch({ type: "setCoreParam", key, value });
                    }}
                  />
                </>
              ) : (
                <FitPanel
                  fit={state.fit}
                  activeModel={state.activeModel}
                  onRawInputChange={(value) => dispatch({ type: "setFitRawInput", value })}
                  onLoadFileText={(text) => dispatch({ type: "setFitRawInput", value: text })}
                  onAutoFit={handleAutoFit}
                  onApplyFit={handleApplyFit}
                  onStageFit={(result) => {
                    dispatch({ type: "setStagedFit", result });
                    dispatch({ type: "setActiveModel", model: result.model });
                  }}
                />
              )}
            </div>
          </aside>

          <section className="animate-fadeUp">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="rounded border border-app-border px-2 py-1 font-chrome text-[10px] uppercase tracking-[0.08em] text-app-muted">
                    {editingScenario
                      ? `Editing: ${editingScenario.name} (${MODEL_LABELS[effectiveModel]})`
                      : `Active: ${MODEL_LABELS[effectiveModel]}`}
                  </div>
                </div>

                {state.rightTab === "chart" ? (
                  <ChartPanel
                    model={effectiveModel}
                    rightTab={state.rightTab}
                    points={activeSeries.points}
                    scenarios={scenarioSeries}
                    milestones={milestones}
                    chartMode={state.chartMode}
                    bassView={state.bassView}
                    outputUnit={effectiveCore.outputUnit}
                    tam={effectiveCore.tam}
                    timeUnit={effectiveCore.timeUnit}
                    richardsNu={effectiveParams.richards.nu}
                    observed={state.fit.data}
                    onSetRightTab={(tab) => dispatch({ type: "setRightTab", tab })}
                    onSetChartMode={(mode) => dispatch({ type: "setChartMode", mode })}
                    onSetBassView={(view) => dispatch({ type: "setBassView", view })}
                    onCopyChart={() => {
                      void copyChart();
                    }}
                    onShare={() => {
                      void shareState();
                    }}
                  />
                ) : (
                  <TablePanel
                    model={effectiveModel}
                    rightTab={state.rightTab}
                    points={activeSeries.points}
                    scenarios={scenarioSeries}
                    milestones={milestones}
                    tam={effectiveCore.tam}
                    timeUnit={effectiveCore.timeUnit}
                    sort={state.tableSort}
                    onSetRightTab={(tab) => dispatch({ type: "setRightTab", tab })}
                    onSort={(sort) => dispatch({ type: "setTableSort", sort })}
                    onCopyChart={() => {
                      void copyChart();
                    }}
                  />
                )}

                <MilestonesPanel milestones={milestones} timeUnit={effectiveCore.timeUnit} scenarioMilestones={scenarioMilestones} />
                <ModelAbout
                  model={effectiveModel}
                  richardsNu={effectiveParams.richards.nu}
                  collapsed={state.aboutCollapsed}
                  onToggle={() => dispatch({ type: "toggleAbout" })}
                />
              </div>
              <aside className="space-y-3">
                <div className="rounded-panel border border-app-border bg-app-surface p-3">
                  <ModelParameters
                    model={effectiveModel}
                    params={effectiveParams}
                    horizon={effectiveCore.horizon}
                    onSetModelParam={(model, key, value) =>
                      editingScenario
                        ? dispatch({ type: "setScenarioModelParam", id: editingScenario.id, key, value })
                        : dispatch({ type: "setModelParam", model, key, value })
                    }
                    compact
                  />
                </div>
                <div className="rounded-panel border border-app-border bg-app-surface p-3">
                  <DisplayControls
                    core={state.core}
                    onSetCore={(key, value) => dispatch({ type: "setCoreParam", key, value })}
                  />
                </div>
              </aside>
            </div>
          </section>
        </div>
      </div>
      {state.toast && <Toast message={state.toast} />}
    </div>
  );
}
