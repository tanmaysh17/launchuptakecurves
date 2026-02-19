import clsx from "clsx";
import { MODEL_DESCRIPTIONS, MODEL_LABELS } from "../lib/models";
import { richardsInflectionLabel } from "../lib/milestones";
import type { ModelType } from "../types";

interface ModelAboutProps {
  model: ModelType;
  richardsNu: number;
  collapsed: boolean;
  onToggle: () => void;
}

function richardsShapeText(nu: number): string {
  if (nu < 0.8) return "Early surge, long tail";
  if (nu > 1.2) return "Slow build, fast finish";
  return "Balanced, logistic-like symmetry";
}

export function ModelAbout({ model, richardsNu, collapsed, onToggle }: ModelAboutProps) {
  const about = MODEL_DESCRIPTIONS[model];
  return (
    <div className="mt-3 rounded-panel border border-app-border bg-app-surface">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="font-chrome text-[11px] uppercase tracking-[0.1em] text-app-muted">About This Model</span>
        <span className="font-chrome text-[10px] uppercase tracking-[0.08em] text-app-text">{collapsed ? "Expand" : "Collapse"}</span>
      </button>
      {!collapsed && (
        <div className="space-y-3 border-t border-app-border px-3 py-3 text-sm text-app-text">
          <div>
            <div className="font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">{MODEL_LABELS[model]}</div>
            <p className="mt-1">{about.oneLiner}</p>
          </div>
          <div>
            <div className="font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">Inflection</div>
            <p className="mt-1">{about.inflection}</p>
            {model === "richards" && <p className="mt-1 text-app-purple">{richardsInflectionLabel(richardsNu)}</p>}
          </div>
          <div>
            <div className="font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">Use Cases</div>
            <p className="mt-1">{about.useCases}</p>
          </div>
          <div>
            <div className="font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">Recommended Ranges</div>
            <p className="mt-1">{about.ranges}</p>
          </div>
          {about.notes && (
            <div className="rounded-panel border border-app-border bg-app-bg/70 px-3 py-2 text-xs text-app-muted">
              {about.notes}
            </div>
          )}
          {model === "richards" && (
            <div className="rounded-panel border border-app-border bg-app-bg/60 p-2">
              <div className="mb-2 font-chrome text-[10px] uppercase tracking-[0.08em] text-app-muted">Richards Nu Shape Schematic</div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className={clsx("rounded border px-2 py-2", richardsNu < 0.8 ? "border-app-purple text-app-purple" : "border-app-border text-app-muted")}>
                  nu &lt; 1
                  <div className="mt-1">Early skew</div>
                </div>
                <div className={clsx("rounded border px-2 py-2", richardsNu >= 0.8 && richardsNu <= 1.2 ? "border-app-accent text-app-accent" : "border-app-border text-app-muted")}>
                  nu = 1
                  <div className="mt-1">Logistic</div>
                </div>
                <div className={clsx("rounded border px-2 py-2", richardsNu > 1.2 ? "border-app-amber text-app-amber" : "border-app-border text-app-muted")}>
                  nu &gt; 1
                  <div className="mt-1">Late skew</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-app-text">{richardsShapeText(richardsNu)}</div>
            </div>
          )}
          {model === "bass" && (
            <div className="rounded-panel border border-app-border bg-app-bg/60 px-3 py-2 text-xs text-app-text">
              <div>
                Bass decomposition: <span className="text-app-accent">p</span> drives external adoption,{" "}
                <span className="text-app-amber">q</span> scales imitation as penetration rises.
              </div>
              <div className="mt-1">
                Typical consumer tech benchmark: <span className="text-app-accent">p~0.03</span>,{" "}
                <span className="text-app-amber">q~0.38</span>.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
