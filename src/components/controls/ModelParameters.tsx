import { ParameterSlider } from "../ui/ParameterSlider";
import { SectionLabel } from "../ui/SectionLabel";
import type { ModelParams, ModelType } from "../../types";

interface ModelParametersProps {
  model: ModelType;
  params: ModelParams;
  horizon: number;
  onSetModelParam: (model: ModelType, key: string, value: number) => void;
}

export function ModelParameters({ model, params, horizon, onSetModelParam }: ModelParametersProps) {
  return (
    <div className="space-y-3">
      <SectionLabel>Shape Parameters</SectionLabel>
      {model === "logistic" && (
        <>
          <ParameterSlider
            id="log-k"
            label="k Steepness"
            value={params.logistic.k}
            min={0.05}
            max={1}
            step={0.01}
            onChange={(value) => onSetModelParam("logistic", "k", value)}
            hint="Controls how quickly uptake accelerates and saturates."
          />
          <ParameterSlider
            id="log-t0"
            label="t0 Inflection"
            value={params.logistic.t0}
            min={1}
            max={horizon}
            step={1}
            onChange={(value) => onSetModelParam("logistic", "t0", Math.round(value))}
            formatter={(v) => `${Math.round(v)}`}
            hint="Period of fastest growth; logistic inflection is always at 50% ceiling."
          />
        </>
      )}
      {model === "gompertz" && (
        <>
          <ParameterSlider
            id="gom-k"
            label="k Steepness"
            value={params.gompertz.k}
            min={0.05}
            max={1}
            step={0.01}
            onChange={(value) => onSetModelParam("gompertz", "k", value)}
            hint="Controls curve steepness once adoption starts moving."
          />
          <ParameterSlider
            id="gom-t0"
            label="t0 Inflection"
            value={params.gompertz.t0}
            min={1}
            max={horizon}
            step={1}
            onChange={(value) => onSetModelParam("gompertz", "t0", Math.round(value))}
            formatter={(v) => `${Math.round(v)}`}
            hint="Reference inflection period; Gompertz inflects near 36.8% of ceiling."
          />
        </>
      )}
      {model === "richards" && (
        <>
          <ParameterSlider
            id="rich-k"
            label="k Steepness"
            value={params.richards.k}
            min={0.05}
            max={1}
            step={0.01}
            onChange={(value) => onSetModelParam("richards", "k", value)}
            hint="Global growth steepness for the generalized logistic family."
          />
          <ParameterSlider
            id="rich-t0"
            label="t0 Reference Time"
            value={params.richards.t0}
            min={1}
            max={horizon}
            step={1}
            onChange={(value) => onSetModelParam("richards", "t0", Math.round(value))}
            formatter={(v) => `${Math.round(v)}`}
            hint="Reference timing anchor that combines with shape parameter nu."
          />
          <ParameterSlider
            id="rich-nu"
            label="Shape (nu)"
            value={params.richards.nu}
            min={0.1}
            max={5}
            step={0.01}
            onChange={(value) => onSetModelParam("richards", "nu", value)}
            hint="Controls asymmetry: nu=1 logistic, lower means earlier inflection, higher means later inflection."
          />
        </>
      )}
      {model === "bass" && (
        <>
          <ParameterSlider
            id="bass-p"
            label="p Innovation"
            value={params.bass.p}
            min={0.001}
            max={0.1}
            step={0.001}
            onChange={(value) => onSetModelParam("bass", "p", value)}
            hint="External influence coefficient (advertising, sales push, non-social adoption)."
          />
          <ParameterSlider
            id="bass-q"
            label="q Imitation"
            value={params.bass.q}
            min={0.01}
            max={0.8}
            step={0.01}
            onChange={(value) => onSetModelParam("bass", "q", value)}
            hint="Word-of-mouth coefficient driving social contagion and network effects."
          />
        </>
      )}
      {model === "linear" && (
        <ParameterSlider
          id="lin-r"
          label="r Ramp Rate"
          value={params.linear.r}
          min={0.5}
          max={20}
          step={0.1}
          onChange={(value) => onSetModelParam("linear", "r", value)}
          formatter={(v) => `${v.toFixed(2)}%/period`}
          hint="Constant adoption gain per period until ceiling is reached."
        />
      )}
    </div>
  );
}
