import { ParameterSlider } from "../../../components/ui/ParameterSlider";
import type { LogNormalParams } from "../../types";

interface LogNormalControlsProps {
  params: LogNormalParams;
  onChange: (key: keyof LogNormalParams, value: number) => void;
}

export function LogNormalControls({ params, onChange }: LogNormalControlsProps) {
  return (
    <div className="space-y-3">
      <ParameterSlider
        id="ln-median"
        label="Median DoT (months)"
        value={params.medianMonths}
        min={1}
        max={60}
        step={0.5}
        onChange={(v) => onChange("medianMonths", v)}
        hint="Median duration of therapy — the month at which 50% of patients have discontinued."
        formatter={(v) => `${v.toFixed(1)} mo`}
      />
      <ParameterSlider
        id="ln-sigma"
        label="Sigma"
        value={params.sigma}
        min={0.1}
        max={3}
        step={0.05}
        onChange={(v) => onChange("sigma", v)}
        hint="Standard deviation of log-time. Higher sigma = more spread/heavier tail."
      />
      <ParameterSlider
        id="ln-ceiling"
        label="Ceiling (%)"
        value={params.ceiling}
        min={50}
        max={100}
        step={1}
        onChange={(v) => onChange("ceiling", v)}
        hint="Maximum % of patients starting therapy."
        formatter={(v) => `${v.toFixed(0)}%`}
      />
    </div>
  );
}
