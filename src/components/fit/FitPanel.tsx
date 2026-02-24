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
const SAMPLE_CSV = "period,adoption%\n1,0.3\n2,0.8\n3,1.4\n4,2.3\n5,3.6\n6,5.2\n7,7.1\n8,9.4\n9,12.0\n10,15.1";

function metricCell(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3) : "--";
}

function isNonDecreasing(values: number[]): boolean {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] + 1e-9 < values[i - 1]) {
      return false;
    }
  }
  return true;
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
  const periods = fit.data.map((d) => d.period);
  const adoptions = fit.data.map((d) => d.adoptionPct);
  const hasData = fit.data.length > 0;
  const minPeriod = hasData ? Math.min(...periods) : null;
  const maxPeriod = hasData ? Math.max(...periods) : null;
  const lastAdoption = hasData ? adoptions[adoptions.length - 1] : null;
  const monotonic = isNonDecreasing(adoptions);
  const lowPointCount = fit.data.length > 0 && fit.data.length < 6;
  const fitDisabledReason =
    activeModel === "linear" ? "Linear Ramp does not require curve fitting." : !fit.data.length ? "Load data to enable fitting." : null;

  return (
    <div className="space-y-3">
      <SectionLabel>Fit To Data</SectionLabel>
      <div className="rounded-panel border border-app-border bg-app-surface/70 p-3 text-sm text-app-text">
        <p className="text-app-muted">Turn analog launch data into calibrated model parameters in four steps.</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <div>
            <div className="font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">Workflow</div>
            <ul className="mt-1 space-y-1 text-xs text-app-muted">
              <li>1. Paste/upload cumulative data: period, adoption%.</li>
              <li>2. Check parsed status and data quality flags.</li>
              <li>3. Click Auto-Fit to estimate parameters.</li>
              <li>4. Stage best model, then Apply Fitted Parameters.</li>
            </ul>
          </div>
          <div>
            <div className="font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">Input Rules</div>
            <ul className="mt-1 space-y-1 text-xs text-app-muted">
              <li>Two columns only, header optional, delimiters: comma/tab/semicolon.</li>
              <li>Adoption must be percentage values in [0, 100].</li>
              <li>Use cumulative adoption (not per-period sales).</li>
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
          placeholder={SAMPLE_CSV}
          className="h-36 w-full resize-y rounded-panel border border-app-border bg-app-bg px-3 py-2 font-mono text-xs text-app-text outline-none focus:border-app-accent"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-app-muted">Format: period,adoption% (e.g., 1,0.3)</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onRawInputChange(SAMPLE_CSV)}
              className="rounded border border-app-border px-2 py-1 font-chrome text-[10px] uppercase tracking-[0.08em] text-app-text hover:border-app-accent hover:text-app-accent"
            >
              Use Example
            </button>
            <button
              type="button"
              onClick={() => onRawInputChange("")}
              className="rounded border border-app-border px-2 py-1 font-chrome text-[10px] uppercase tracking-[0.08em] text-app-muted hover:text-app-text"
            >
              Clear
            </button>
          </div>
        </div>
        <FileDropZone onLoadFileText={onLoadFileText} />
        {fit.error && <p className="mt-2 text-xs text-red-400">{fit.error}</p>}
        {!fit.error && fit.data.length > 0 && (
          <div className="mt-3 rounded-panel border border-app-border bg-app-bg/60 p-2">
            <div className="font-chrome text-[10px] uppercase tracking-[0.08em] text-app-muted">Parsed Data Status</div>
            <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-app-text">
              <div>Rows: {fit.data.length}</div>
              <div>
                Periods: {minPeriod} to {maxPeriod}
              </div>
              <div>Latest Adoption: {lastAdoption == null ? "--" : fmtPct(lastAdoption)}</div>
              <div>Monotonic Cumulative: {monotonic ? "Yes" : "No"}</div>
            </div>
            <div className="mt-2 space-y-1 text-[11px]">
              {!monotonic && <div className="text-red-400">Warning: adoption decreases in at least one period.</div>}
              {lowPointCount && <div className="text-app-amber">Tip: use at least 6 points for more stable fit.</div>}
            </div>
          </div>
        )}
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
        {fitDisabledReason && <p className="mt-2 text-xs text-app-muted">{fitDisabledReason}</p>}
        {!fitDisabledReason && (
          <p className="mt-2 text-xs text-app-muted">Auto-Fit runs bounded optimization and compares Logistic, Gompertz, Richards, and Bass.</p>
        )}
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
                          Stage Model
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
