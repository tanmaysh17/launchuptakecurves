import { ParameterSlider } from "../../../components/ui/ParameterSlider";
import type { MixtureCureParams } from "../../types";

interface MixtureCureControlsProps {
  params: MixtureCureParams;
  onChange: (key: keyof MixtureCureParams, value: number) => void;
}

export function MixtureCureControls({ params, onChange }: MixtureCureControlsProps) {
  return (
    <div className="space-y-3">
      <ParameterSlider
        id="mc-pi"
        label="Cure Fraction (pi)"
        value={params.pi}
        min={0.01}
        max={0.8}
        step={0.01}
        onChange={(v) => onChange("pi", v)}
        hint="Fraction of patients who are 'cured' and never relapse. The curve plateaus at pi*100%."
        formatter={(v) => `${(v * 100).toFixed(0)}%`}
      />
      <ParameterSlider
        id="mc-lambda"
        label="Scale (lambda)"
        value={params.lambda}
        min={0.5}
        max={60}
        step={0.5}
        onChange={(v) => onChange("lambda", v)}
        hint="Weibull scale parameter for the uncured population."
        formatter={(v) => `${v.toFixed(1)} mo`}
      />
      <ParameterSlider
        id="mc-k"
        label="Shape (k)"
        value={params.k}
        min={0.2}
        max={5}
        step={0.05}
        onChange={(v) => onChange("k", v)}
        hint="Weibull shape parameter for the uncured population."
      />
    </div>
  );
}
