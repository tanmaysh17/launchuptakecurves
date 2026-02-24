import { ParameterSlider } from "../ui/ParameterSlider";
import { SectionLabel } from "../ui/SectionLabel";
import type { CoreParams } from "../../types";

interface CoreParametersProps {
  core: CoreParams;
  onSetCore: (key: keyof CoreParams, value: number | string | null) => void;
}

export function CoreParameters({ core, onSetCore }: CoreParametersProps) {
  const ttpEnabled = core.timeToPeak != null;

  return (
    <div className="space-y-3">
      <SectionLabel>Core Parameters</SectionLabel>
      <ParameterSlider
        id="ceiling"
        label="Adoption Ceiling"
        value={core.ceilingPct}
        min={1}
        max={100}
        step={1}
        onChange={(value) => onSetCore("ceilingPct", value)}
        formatter={(v) => `${v.toFixed(0)}%`}
        hint="Maximum penetration level your launch can reach over time."
      />
      <ParameterSlider
        id="horizon"
        label="Time Horizon"
        value={core.horizon}
        min={12}
        max={120}
        step={1}
        onChange={(value) => onSetCore("horizon", Math.round(value))}
        formatter={(v) => `${Math.round(v)}`}
        hint="Number of periods calculated in chart, table, and milestones."
      />
      <ParameterSlider
        id="lag"
        label="Launch Lag"
        value={core.launchLag}
        min={0}
        max={24}
        step={1}
        onChange={(value) => onSetCore("launchLag", Math.round(value))}
        formatter={(v) => `${Math.round(v)}`}
        hint="Periods of near-zero uptake before launch momentum begins."
      />
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="font-chrome text-[10px] uppercase tracking-[0.08em] text-app-muted">
            Time to Peak (99%)
          </label>
          <button
            type="button"
            onClick={() => onSetCore("timeToPeak", ttpEnabled ? null : Math.round(core.horizon * 0.6))}
            className="rounded border border-app-border px-1.5 py-0.5 font-chrome text-[9px] uppercase tracking-[0.08em] text-app-muted hover:border-app-accent hover:text-app-accent"
          >
            {ttpEnabled ? "Disable" : "Enable"}
          </button>
        </div>
        {ttpEnabled && (
          <ParameterSlider
            id="ttp"
            label=""
            value={core.timeToPeak!}
            min={core.launchLag + 2}
            max={core.horizon}
            step={1}
            onChange={(value) => onSetCore("timeToPeak", Math.round(value))}
            formatter={(v) => `${Math.round(v)}`}
            hint="Auto-adjusts steepness (k) so the curve reaches 99% of ceiling by this period. Overrides k slider."
          />
        )}
      </div>
    </div>
  );
}
