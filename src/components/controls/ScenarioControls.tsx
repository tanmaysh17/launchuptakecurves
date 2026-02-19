import { SectionLabel } from "../ui/SectionLabel";
import type { Scenario } from "../../types";
import { MODEL_LABELS } from "../../lib/models";

interface ScenarioControlsProps {
  scenarios: Scenario[];
  onAdd: () => void;
  onClear: () => void;
  onRename: (id: string, name: string) => void;
}

function summaryText(scenario: Scenario): string {
  const base = `${MODEL_LABELS[scenario.model]} | Ceiling=${scenario.coreSnapshot.ceilingPct.toFixed(0)}% | Lag=${scenario.coreSnapshot.launchLag}`;
  const p = scenario.paramsSnapshot as unknown as Record<string, unknown>;
  const paramsObj: Record<string, number> = {};
  if (typeof p.k === "number") paramsObj.k = p.k;
  if (typeof p.t0 === "number") paramsObj.t0 = p.t0;
  if (typeof p.nu === "number") paramsObj.nu = p.nu;
  if (typeof p.p === "number") paramsObj.p = p.p;
  if (typeof p.q === "number") paramsObj.q = p.q;
  if (typeof p.r === "number") paramsObj.r = p.r;
  const params = Object.entries(paramsObj)
    .map(([k, v]) => `${k}=${v.toFixed(2)}`)
    .join(" | ");
  return `${base} | ${params}`;
}

export function ScenarioControls({ scenarios, onAdd, onClear, onRename }: ScenarioControlsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <SectionLabel>Scenario Comparison</SectionLabel>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAdd}
            className="rounded-panel border border-app-accent bg-[rgba(0,212,180,0.12)] px-2 py-1 font-chrome text-[11px] uppercase tracking-[0.08em] text-app-accent"
          >
            Add Scenario
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-panel border border-app-border px-2 py-1 font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted hover:text-app-text"
          >
            Clear All
          </button>
        </div>
      </div>
      {!!scenarios.length && (
        <div className="space-y-2">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="rounded-panel border border-app-border bg-app-surface p-2"
              style={{ borderLeft: `3px solid ${scenario.color}` }}
            >
              <input
                value={scenario.name}
                onChange={(event) => onRename(scenario.id, event.target.value)}
                className="w-full bg-transparent font-chrome text-xs uppercase tracking-[0.08em] text-app-text outline-none"
              />
              <p className="mt-1 text-[11px] text-app-muted">{summaryText(scenario)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
