import { ParameterSlider } from "../ui/ParameterSlider";
import { SectionLabel } from "../ui/SectionLabel";
import type { ModelParams, ModelType } from "../../types";

interface ModelParametersProps {
  model: ModelType;
  params: ModelParams;
  horizon: number;
  onSetModelParam: (model: ModelType, key: string, value: number) => void;
  compact?: boolean;
}

export function ModelParameters({ model, params, horizon: _horizon, onSetModelParam, compact = false }: ModelParametersProps) {
  const layoutClass = compact
    ? model === "linear"
      ? "grid grid-cols-1 gap-2"
      : "grid grid-cols-1 gap-2 lg:grid-cols-2"
    : "space-y-3";

  return (
    <div>
      <SectionLabel>Shape Parameters</SectionLabel>
      <div className={layoutClass}>
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
            hint="Controls how quickly uptake accelerates and saturates. Overridden when Time to Peak is enabled."
          />
          <ParameterSlider
            id="log-t0"
            label="Responsiveness"
            value={params.logistic.t0}
            min={0.05}
            max={0.95}
            step={0.01}
            onChange={(value) => onSetModelParam("logistic", "t0", value)}
            formatter={(v) => v.toFixed(2)}
            hint="Inflection timing as fraction of horizon (0=early, 1=late). Logistic inflects at 50% ceiling."
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
            hint="Controls curve steepness once adoption starts moving. Overridden when Time to Peak is enabled."
          />
          <ParameterSlider
            id="gom-t0"
            label="Responsiveness"
            value={params.gompertz.t0}
            min={0.05}
            max={0.95}
            step={0.01}
            onChange={(value) => onSetModelParam("gompertz", "t0", value)}
            formatter={(v) => v.toFixed(2)}
            hint="Inflection timing as fraction of horizon (0=early, 1=late). Gompertz inflects near 36.8% ceiling."
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
            hint="Global growth steepness. Overridden when Time to Peak is enabled."
          />
          <ParameterSlider
            id="rich-t0"
            label="Responsiveness"
            value={params.richards.t0}
            min={0.05}
            max={0.95}
            step={0.01}
            onChange={(value) => onSetModelParam("richards", "t0", value)}
            formatter={(v) => v.toFixed(2)}
            hint="Inflection timing as fraction of horizon (0=early, 1=late). Combines with shape parameter nu."
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
          label="r Ramp Rate (%/period)"
          value={params.linear.r}
          min={0.5}
          max={20}
          step={0.1}
          onChange={(value) => onSetModelParam("linear", "r", value)}
          formatter={(v) => v.toFixed(2)}
          hint="Constant adoption gain per period until ceiling is reached."
        />
      )}
      </div>
    </div>
  );
}
