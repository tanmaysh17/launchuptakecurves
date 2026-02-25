import { ParameterSlider } from "../../../components/ui/ParameterSlider";
import type { ExponentialParams } from "../../types";

interface ExponentialControlsProps {
  params: ExponentialParams;
  onChange: (key: keyof ExponentialParams, value: number) => void;
}

export function ExponentialControls({ params, onChange }: ExponentialControlsProps) {
  return (
    <div className="space-y-3">
      <ParameterSlider
        id="exp-lambda"
        label="Hazard Rate (lambda)"
        value={params.lambda}
        min={0.005}
        max={1}
        step={0.005}
        onChange={(v) => onChange("lambda", v)}
        hint="Constant hazard rate. Median DoT = ln(2)/lambda. Higher lambda = faster dropout."
        formatter={(v) => v.toFixed(3)}
      />
      <ParameterSlider
        id="exp-ceiling"
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
