import clsx from "clsx";
import { SectionLabel } from "../../components/ui/SectionLabel";
import type { FitResult, FittableCurveModel, KMDataPoint, TargetPoint } from "../types";

interface FitPanelProps {
  kmRawInput: string;
  kmData: KMDataPoint[];
  kmError: string | null;
  fitting: boolean;
  fitResults: Partial<Record<FittableCurveModel, FitResult>>;
  stagedFit: FitResult | null;
  targetInput: string;
  targets: TargetPoint[];
  onRawInputChange: (value: string) => void;
  onLoadFileText: (text: string) => void;
  onAutoFit: () => void;
  onApplyFit: () => void;
  onStageFit: (result: FitResult) => void;
  onTargetInputChange: (value: string) => void;
  onTargetsChange: (targets: TargetPoint[]) => void;
  onFitTargets: () => void;
}

const MODEL_LABELS: Record<FittableCurveModel, string> = {
  weibull: "Weibull",
  exponential: "Exponential",
  logNormal: "Log-Normal",
  mixtureCure: "Mixture Cure"
};

const MODEL_COMPARISON_ORDER: FittableCurveModel[] = ["weibull", "exponential", "logNormal", "mixtureCure"];

const SAMPLE_CSV = "month,survival%\n0,100\n3,85\n6,65\n9,50\n12,38\n18,22\n24,12";
const SAMPLE_TARGETS = "M3=85%, M6=65%, M12=38%, M24=12%";

export function parseTargets(input: string): TargetPoint[] {
  if (!input.trim()) return [];
  const targets: TargetPoint[] = [];
  const parts = input.split(/[,;\n]+/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // Match: M3=85%, M6=65, 3=85, M12 at 38%
    const match = trimmed.match(/^M?(\d+)\s*[=:@]\s*(\d+(?:\.\d+)?)\s*%?\s*$/i);
    if (match) {
      const month = parseInt(match[1], 10);
      const survival = parseFloat(match[2]);
      if (month >= 0 && survival >= 0 && survival <= 100) {
        targets.push({ month, survival });
      }
    }
  }
  return targets.sort((a, b) => a.month - b.month);
}

function isNonIncreasing(values: number[]): boolean {
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1] + 1e-9) return false;
  }
  return true;
}

function bestResult(results: FitResult[]): FitResult | null {
  if (!results.length) return null;
  return [...results].sort((a, b) => b.r2 - a.r2)[0];
}

export function FitPanel({
  kmRawInput,
  kmData,
  kmError,
  fitting,
  fitResults,
  stagedFit,
  targetInput,
  targets,
  onRawInputChange,
  onLoadFileText,
  onAutoFit,
  onApplyFit,
  onStageFit,
  onTargetInputChange,
  onTargetsChange,
  onFitTargets
}: FitPanelProps) {
  const allResults = Object.values(fitResults).filter(Boolean) as FitResult[];
  const best = bestResult(allResults);
  const survivals = kmData.map((d) => d.survival);
  const monotonic = isNonIncreasing(survivals);
  const lowPointCount = kmData.length > 0 && kmData.length < 6;

  return (
    <div className="space-y-3">
      <SectionLabel>Fit To Data</SectionLabel>

      {/* Quick Targets */}
      <div className="rounded-panel border border-app-border bg-app-surface p-3">
        <label className="mb-2 block font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">
          Quick Targets
        </label>
        <input
          type="text"
          value={targetInput}
          onChange={(e) => {
            onTargetInputChange(e.target.value);
            onTargetsChange(parseTargets(e.target.value));
          }}
          placeholder={SAMPLE_TARGETS}
          className="w-full rounded-panel border border-app-border bg-app-bg px-3 py-2 font-mono text-xs text-app-text outline-none focus:border-app-accent"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-app-muted">
            {targets.length > 0
              ? `${targets.length} target${targets.length > 1 ? "s" : ""} set`
              : "e.g. M3=85%, M6=65%, M12=38%"}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onTargetInputChange(SAMPLE_TARGETS);
                onTargetsChange(parseTargets(SAMPLE_TARGETS));
              }}
              className="rounded border border-app-border px-2 py-1 font-chrome text-[10px] uppercase tracking-[0.08em] text-app-text hover:border-app-accent hover:text-app-accent"
            >
              Example
            </button>
            <button
              type="button"
              onClick={onFitTargets}
              disabled={targets.length < 2 || fitting}
              className={clsx(
                "rounded border px-2 py-1 font-chrome text-[10px] uppercase tracking-[0.08em]",
                targets.length >= 2 && !fitting
                  ? "border-app-accent bg-[rgb(var(--app-accent)/0.12)] text-app-accent"
                  : "cursor-not-allowed border-app-border text-app-muted"
              )}
            >
              Fit Targets
            </button>
          </div>
        </div>
        {targets.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {targets.map((t) => (
              <span
                key={t.month}
                className="rounded bg-[rgb(var(--app-accent)/0.12)] px-2 py-0.5 font-mono text-[11px] text-app-accent"
              >
                M{t.month}={t.survival}%
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="rounded-panel border border-app-border bg-app-surface/70 p-3 text-sm text-app-text">
        <p className="text-app-muted">Fit survival models to real-world Kaplan-Meier or persistency data.</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <div>
            <div className="font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">Workflow</div>
            <ul className="mt-1 space-y-1 text-xs text-app-muted">
              <li>1. Paste/upload survival data: month, survival%.</li>
              <li>2. Check parsed status and data quality flags.</li>
              <li>3. Click Auto-Fit to estimate parameters.</li>
              <li>4. Stage best model, then Apply Fitted Parameters.</li>
            </ul>
          </div>
          <div>
            <div className="font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">Input Rules</div>
            <ul className="mt-1 space-y-1 text-xs text-app-muted">
              <li>Two columns: month, survival%. Header optional.</li>
              <li>Survival must be percentage values in [0, 100].</li>
              <li>Data should be monotonically decreasing.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CSV Paste */}
      <div className="rounded-panel border border-app-border bg-app-surface p-3">
        <label className="mb-2 block font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">
          Paste CSV (month, survival%)
        </label>
        <textarea
          value={kmRawInput}
          onChange={(e) => onRawInputChange(e.target.value)}
          placeholder={SAMPLE_CSV}
          className="h-36 w-full resize-y rounded-panel border border-app-border bg-app-bg px-3 py-2 font-mono text-xs text-app-text outline-none focus:border-app-accent"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-app-muted">Format: month,survival% (e.g., 6,65)</div>
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

        {/* File drop zone */}
        <FileDropZone onLoadFileText={onLoadFileText} />

        {kmError && <p className="mt-2 text-xs text-red-400">{kmError}</p>}
        {!kmError && kmData.length > 0 && (
          <div className="mt-3 rounded-panel border border-app-border bg-app-bg/60 p-2">
            <div className="font-chrome text-[10px] uppercase tracking-[0.08em] text-app-muted">Parsed Data Status</div>
            <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-app-text">
              <div>Rows: {kmData.length}</div>
              <div>
                Months: {Math.min(...kmData.map((d) => d.month))} to {Math.max(...kmData.map((d) => d.month))}
              </div>
              <div>First S(t): {kmData[0]?.survival.toFixed(1)}%</div>
              <div>Last S(t): {kmData[kmData.length - 1]?.survival.toFixed(1)}%</div>
            </div>
            <div className="mt-2 space-y-1 text-[11px]">
              {!monotonic && <div className="text-red-400">Warning: survival increases in at least one interval.</div>}
              {lowPointCount && <div className="text-[rgb(var(--app-amber))]">Tip: use at least 6 points for more stable fit.</div>}
            </div>
          </div>
        )}

        {/* Fit Buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAutoFit}
            disabled={!kmData.length || fitting}
            className={clsx(
              "rounded-panel border px-3 py-1.5 font-chrome text-[11px] uppercase tracking-[0.08em]",
              !kmData.length || fitting
                ? "cursor-not-allowed border-app-border text-app-muted"
                : "border-app-accent bg-[rgb(var(--app-accent)/0.12)] text-app-accent"
            )}
          >
            {fitting ? "Fitting..." : "Auto-Fit"}
          </button>
          <button
            type="button"
            onClick={onApplyFit}
            disabled={!stagedFit}
            className={clsx(
              "rounded-panel border px-3 py-1.5 font-chrome text-[11px] uppercase tracking-[0.08em]",
              stagedFit
                ? "border-[rgb(var(--app-amber))] bg-[rgb(var(--app-amber)/0.12)] text-[rgb(var(--app-amber))]"
                : "cursor-not-allowed border-app-border text-app-muted"
            )}
          >
            Apply Fitted Parameters
          </button>
        </div>
        {!kmData.length && <p className="mt-2 text-xs text-app-muted">Load data to enable fitting.</p>}
      </div>

      {/* Model Comparison Table */}
      {allResults.length > 0 && (
        <div className="rounded-panel border border-app-border bg-app-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">Model Comparison</h3>
            {best && (
              <span className="rounded bg-[rgb(var(--app-accent)/0.15)] px-2 py-1 text-[11px] text-app-accent">
                Best: {MODEL_LABELS[best.model as FittableCurveModel]}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-app-border font-chrome uppercase tracking-[0.08em] text-app-muted">
                  <th className="px-2 py-2">Model</th>
                  <th className="px-2 py-2">R²</th>
                  <th className="px-2 py-2">SSE</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {MODEL_COMPARISON_ORDER.map((model) => {
                  const result = fitResults[model];
                  const isBest = best?.model === model;
                  const isStaged = stagedFit?.model === model;
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
                        {result ? result.r2.toFixed(4) : "--"}
                      </td>
                      <td className="px-2 py-2 font-mono text-app-text">
                        {result ? result.sse.toFixed(1) : "--"}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          disabled={!result}
                          onClick={() => result && onStageFit(result)}
                          className={clsx(
                            "rounded border px-2 py-1 font-chrome text-[10px] uppercase tracking-[0.08em]",
                            isStaged
                              ? "border-app-accent bg-app-accent/15 text-app-accent"
                              : result
                                ? "border-app-border text-app-text hover:border-app-accent hover:text-app-accent"
                                : "cursor-not-allowed border-app-border text-app-muted"
                          )}
                        >
                          {isStaged ? "Staged" : "Stage"}
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
    if (!file) return;
    const text = await file.text();
    onLoadFileText(text);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void onFiles(e.dataTransfer.files);
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
            onChange={(e) => {
              void onFiles(e.target.files);
            }}
          />
        </label>
      </div>
    </div>
  );
}
