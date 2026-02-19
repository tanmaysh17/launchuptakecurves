import { ParameterSlider } from "../ui/ParameterSlider";
import { SectionLabel } from "../ui/SectionLabel";
import type { CoreParams } from "../../types";

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
    </div>
  );
}
