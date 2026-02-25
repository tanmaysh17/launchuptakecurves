import { SectionLabel } from "../../../components/ui/SectionLabel";
import type { PersistencyScenario, CurveModel } from "../../types";

interface PersistencyScenarioControlsProps {
  scenarios: PersistencyScenario[];
  selectedScenarioId: string | null;
  onAdd: () => void;
  onClear: () => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onSelectScenario: (id: string | null) => void;
}

const MODEL_LABELS: Record<CurveModel, string> = {
  weibull: "Weibull",
  exponential: "Exponential",
  logNormal: "Log-Normal",
  piecewise: "Piecewise",
  mixtureCure: "Mixture Cure",
};

function summaryText(scenario: PersistencyScenario): string {
  const base = MODEL_LABELS[scenario.model];
  const p = scenario.paramsSnapshot as unknown as Record<string, unknown>;
  const parts: string[] = [base];

  if (typeof p.lambda === "number") parts.push(`λ=${(p.lambda as number).toFixed(1)}`);
  if (typeof p.k === "number") parts.push(`k=${(p.k as number).toFixed(2)}`);
  if (typeof p.ceiling === "number") parts.push(`ceil=${(p.ceiling as number).toFixed(0)}%`);
  if (typeof p.pi === "number") parts.push(`π=${(p.pi as number).toFixed(2)}`);
  if (typeof p.medianMonths === "number") parts.push(`med=${(p.medianMonths as number).toFixed(1)}mo`);
  if (typeof p.sigma === "number") parts.push(`σ=${(p.sigma as number).toFixed(2)}`);

  return parts.join(" | ");
}

export function PersistencyScenarioControls({
  scenarios,
  selectedScenarioId,
  onAdd,
  onClear,
  onRemove,
  onRename,
  onSelectScenario,
}: PersistencyScenarioControlsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <SectionLabel>Scenario Comparison</SectionLabel>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAdd}
            disabled={scenarios.length >= 4}
            className="rounded-panel border border-app-accent bg-[rgb(var(--app-accent)/0.12)] px-2 py-1 font-chrome text-[11px] uppercase tracking-[0.08em] text-app-accent disabled:opacity-40"
          >
            Add Scenario
          </button>
          {scenarios.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-panel border border-app-border px-2 py-1 font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted hover:text-app-text"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
      {scenarios.length > 0 && (
        <div className="space-y-2">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="rounded-panel border border-app-border bg-app-surface p-2"
              style={{ borderLeft: `3px solid ${scenario.color}` }}
            >
              <div className="flex items-center gap-2">
                <input
                  value={scenario.name}
                  onChange={(e) => onRename(scenario.id, e.target.value)}
                  className="w-full bg-transparent font-chrome text-xs uppercase tracking-[0.08em] text-app-text outline-none"
                />
                <button
                  type="button"
                  onClick={() => onSelectScenario(selectedScenarioId === scenario.id ? null : scenario.id)}
                  className="shrink-0 rounded border border-app-border px-2 py-0.5 font-chrome text-[10px] uppercase tracking-[0.08em] text-app-text hover:border-app-accent hover:text-app-accent"
                >
                  {selectedScenarioId === scenario.id ? "Done" : "Edit"}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(scenario.id)}
                  className="shrink-0 rounded border border-app-border px-1.5 py-0.5 font-chrome text-[10px] text-app-muted hover:border-red-400 hover:text-red-400"
                  title="Remove scenario"
                >
                  ×
                </button>
              </div>
              {selectedScenarioId === scenario.id && (
                <p className="mt-1 font-chrome text-[10px] uppercase tracking-[0.08em] text-app-accent">
                  Editing — parameter changes update this scenario
                </p>
              )}
              <p className="mt-1 text-[11px] text-app-muted">{summaryText(scenario)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
