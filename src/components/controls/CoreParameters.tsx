import { ParameterSlider } from "../ui/ParameterSlider";
import { PillTabs } from "../ui/PillTabs";
import { SectionLabel } from "../ui/SectionLabel";
import type { CoreParams, OutputUnit, TimeUnit } from "../../types";

interface CoreParametersProps {
  core: CoreParams;
  onSetCore: (key: keyof CoreParams, value: number | string | null) => void;
}

export function CoreParameters({ core, onSetCore }: CoreParametersProps) {
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
      <div className="rounded-panel border border-app-border bg-app-surface/60 px-3 py-3">
        <div className="mb-2 font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">Time Unit</div>
        <PillTabs<TimeUnit>
          value={core.timeUnit}
          onChange={(value) => onSetCore("timeUnit", value)}
          options={[
            { key: "months", label: "Months" },
            { key: "weeks", label: "Weeks" }
          ]}
        />
      </div>
      <div className="rounded-panel border border-app-border bg-app-surface/60 px-3 py-3">
        <div className="mb-2 font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">Output Units</div>
        <PillTabs<OutputUnit>
          value={core.outputUnit}
          onChange={(value) => onSetCore("outputUnit", value)}
          options={[
            { key: "percent", label: "Percent" },
            { key: "volume", label: "Volume" }
          ]}
        />
        {core.outputUnit === "volume" && (
          <label className="mt-3 block">
            <span className="mb-1 block font-chrome text-[11px] uppercase tracking-[0.08em] text-app-muted">
              Total Addressable Market
            </span>
            <input
              type="number"
              min={1}
              step={1}
              value={core.tam ?? ""}
              onChange={(event) => onSetCore("tam", event.target.value ? Number(event.target.value) : null)}
              placeholder="Enter TAM"
              className="w-full rounded-panel border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none placeholder:text-app-muted focus:border-app-accent"
            />
          </label>
        )}
      </div>
    </div>
  );
}
