import clsx from "clsx";
import { MODEL_LABELS } from "../../lib/models";
import { fmtPct } from "../../lib/format";
import type { FitResult, FitState, ModelType } from "../../types";
import { SectionLabel } from "../ui/SectionLabel";

interface FitPanelProps {
  fit: FitState;
  activeModel: ModelType;
  onRawInputChange: (value: string) => void;
  onLoadFileText: (text: string) => void;
  onAutoFit: () => void;
  onApplyFit: () => void;
  onStageFit: (result: FitResult) => void;
}

const MODEL_COMPARISON_ORDER: ModelType[] = ["logistic", "gompertz", "richards", "bass"];

function metricCell(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3) : "--";
}

export function FitPanel({
  fit,
  activeModel,
  onRawInputChange,
  onLoadFileText,
  onAutoFit,
  onApplyFit,
  onStageFit
}: FitPanelProps) {
  const best = bestResult(Object.values(fit.fitResults).filter(Boolean) as FitResult[]);

  return (
    <div className="space-y-3">
      <SectionLabel>Fit To Data</SectionLabel>
      <div className="rounded-panel border border-app-border bg-app-surface/70 p-3 text-sm text-app-text">
        <p className="text-app-muted">
          Fit to Data estimates model parameters from observed adoption points so your forecast shape reflects real launch evidence.
        </p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <div>
            <div className="font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">How To Use</div>
            <ul className="mt-1 space-y-1 text-xs text-app-muted">
              <li>Paste or upload two columns: period, adoption%.</li>
              <li>Click Auto-Fit to optimize parameters for each model.</li>
              <li>Review R2, RMSE, and MAPE before applying.</li>
            </ul>
          </div>
          <div>
            <div className="font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">Best Practices</div>
            <ul className="mt-1 space-y-1 text-xs text-app-muted">
              <li>Use cumulative adoption data, not period-only sales.</li>
              <li>Include enough early and mid-stage points to identify shape.</li>
              <li>Treat very high R2 with caution when sample size is small.</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="rounded-panel border border-app-border bg-app-surface p-3">
        <label className="mb-2 block font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">
          Paste CSV (period, adoption%)
        </label>
        <textarea
          value={fit.rawInput}
          onChange={(event) => onRawInputChange(event.target.value)}
          placeholder={"period,adoption%\n1,0.3\n2,0.8\n3,1.4"}
          className="h-36 w-full resize-y rounded-panel border border-app-border bg-app-bg px-3 py-2 font-mono text-xs text-app-text outline-none focus:border-app-accent"
        />
        <FileDropZone onLoadFileText={onLoadFileText} />
        {fit.error && <p className="mt-2 text-xs text-red-400">{fit.error}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAutoFit}
            disabled={!fit.data.length || activeModel === "linear" || fit.isFitting}
            className={clsx(
              "rounded-panel border px-3 py-1.5 font-chrome text-[11px] uppercase tracking-[0.08em]",
              !fit.data.length || activeModel === "linear" || fit.isFitting
                ? "cursor-not-allowed border-app-border text-app-muted"
                : "border-app-accent bg-[rgb(var(--app-accent)/0.12)] text-app-accent"
            )}
          >
            {fit.isFitting ? "Fitting..." : "Auto-Fit"}
          </button>
          <button
            type="button"
            onClick={onApplyFit}
            disabled={!fit.stagedFit}
            className={clsx(
              "rounded-panel border px-3 py-1.5 font-chrome text-[11px] uppercase tracking-[0.08em]",
              fit.stagedFit
                ? "border-app-amber bg-[rgb(var(--app-amber)/0.12)] text-app-amber"
                : "cursor-not-allowed border-app-border text-app-muted"
            )}
          >
            Apply Fitted Parameters
          </button>
        </div>
      </div>

      {fit.data.length > 0 && (
        <div className="rounded-panel border border-app-border bg-app-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">Model Comparison</h3>
            {best && (
              <span className="rounded bg-[rgb(var(--app-accent)/0.15)] px-2 py-1 text-[11px] text-app-accent">
                Best: {MODEL_LABELS[best.model]}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-app-border font-chrome uppercase tracking-[0.08em] text-app-muted">
                  <th className="px-2 py-2">Model</th>
                  <th className="px-2 py-2">R2</th>
                  <th className="px-2 py-2">RMSE</th>
                  <th className="px-2 py-2">MAPE</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {MODEL_COMPARISON_ORDER.map((model) => {
                  const result = fit.fitResults[model];
                  const isBest = best?.model === model;
                  return (
                    <tr
                      key={model}
                      className={clsx(
                        "border-b border-app-border/50",
                        isBest && "bg-[rgb(var(--app-accent)/0.08)]"
                      )}
                    >
                      <td className="px-2 py-2 text-app-text">{MODEL_LABELS[model]}</td>
                      <td className="px-2 py-2 font-mono text-app-text">
                        {result ? metricCell(result.metrics.r2) : "--"}
                      </td>
                      <td className="px-2 py-2 font-mono text-app-text">
                        {result ? fmtPct(result.metrics.rmse) : "--"}
                      </td>
                      <td className="px-2 py-2 font-mono text-app-text">
                        {result ? fmtPct(result.metrics.mape) : "--"}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          disabled={!result}
                          onClick={() => result && onStageFit(result)}
                          className={clsx(
                            "rounded border px-2 py-1 font-chrome text-[10px] uppercase tracking-[0.08em]",
                            result
                              ? "border-app-border text-app-text hover:border-app-accent hover:text-app-accent"
                              : "cursor-not-allowed border-app-border text-app-muted"
                          )}
                        >
                          Switch To This
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface FileDropZoneProps {
  onLoadFileText: (text: string) => void;
}

function FileDropZone({ onLoadFileText }: FileDropZoneProps) {
  const onFiles = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    onLoadFileText(text);
  };

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        void onFiles(event.dataTransfer.files);
      }}
      className="mt-3 rounded-panel border border-dashed border-app-border bg-app-bg/60 px-3 py-3 text-center text-xs text-app-muted"
    >
      Drag and drop CSV file here
      <div className="mt-2">
        <label className="inline-flex cursor-pointer rounded border border-app-border px-2 py-1 font-chrome text-[10px] uppercase tracking-[0.08em] text-app-text">
          Upload File
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={(event) => {
              void onFiles(event.target.files);
            }}
          />
        </label>
      </div>
    </div>
  );
}

function bestResult(results: FitResult[]): FitResult | null {
  if (!results.length) {
    return null;
  }
  return [...results].sort((a, b) => {
    if (a.metrics.rmse !== b.metrics.rmse) {
      return a.metrics.rmse - b.metrics.rmse;
    }
    return b.metrics.r2 - a.metrics.r2;
  })[0];
}
