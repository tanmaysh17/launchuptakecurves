import { ParameterSlider } from "../../../components/ui/ParameterSlider";
import type { WeibullParams } from "../../types";

interface WeibullControlsProps {
  params: WeibullParams;
  onChange: (key: keyof WeibullParams, value: number) => void;
}

export function WeibullControls({ params, onChange }: WeibullControlsProps) {
  return (
    <div className="space-y-3">
      <ParameterSlider
        id="weibull-lambda"
        label="Scale (lambda)"
        value={params.lambda}
        min={0.5}
        max={60}
        step={0.5}
        onChange={(v) => onChange("lambda", v)}
        hint="Characteristic life — the time at which ~63.2% of patients have discontinued (when k=1). Higher values shift the curve right."
        formatter={(v) => `${v.toFixed(1)} mo`}
      />
      <ParameterSlider
        id="weibull-k"
        label="Shape (k)"
        value={params.k}
        min={0.2}
        max={5}
        step={0.05}
        onChange={(v) => onChange("k", v)}
        hint="k<1: decreasing hazard (early dropout). k=1: constant hazard (exponential). k>1: increasing hazard (late dropout)."
      />
      <ParameterSlider
        id="weibull-ceiling"
        label="Ceiling (%)"
        value={params.ceiling}
        min={50}
        max={100}
        step={1}
        onChange={(v) => onChange("ceiling", v)}
        hint="Maximum % of patients starting therapy. Set <100 if some patients never initiate."
        formatter={(v) => `${v.toFixed(0)}%`}
      />
    </div>
  );
}
