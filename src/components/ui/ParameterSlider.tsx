import { InfoHint } from "./InfoHint";

interface ParameterSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatter?: (value: number) => string;
  hint: string;
}

export function ParameterSlider({
  id,
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  formatter,
  hint
}: ParameterSliderProps) {
  return (
    <div className="rounded-panel border border-app-border bg-app-surface/60 px-3 py-3">
      <label htmlFor={id} className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-medium tracking-[0.01em] text-app-text/90">
          {label}
          <InfoHint text={hint} />
        </span>
        <span className="font-chrome text-[13px] text-app-text">{formatter ? formatter(value) : value.toFixed(2)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="slider w-full"
      />
      <div className="mt-1 flex justify-between font-chrome text-[11px] text-app-muted">
        <span>{formatter ? formatter(min) : min.toFixed(2)}</span>
        <span>{formatter ? formatter(max) : max.toFixed(2)}</span>
      </div>
    </div>
  );
}
