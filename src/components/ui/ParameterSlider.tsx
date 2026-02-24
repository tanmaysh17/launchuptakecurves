import { useEffect, useMemo, useState } from "react";
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
  const decimals = useMemo(() => {
    const text = String(step);
    const dot = text.indexOf(".");
    return dot >= 0 ? text.length - dot - 1 : 0;
  }, [step]);

  const formatInputValue = (next: number): string => {
    if (decimals === 0) {
      return `${Math.round(next)}`;
    }
    return next.toFixed(decimals);
  };

  const [draft, setDraft] = useState<string>(formatInputValue(value));

  useEffect(() => {
    setDraft(formatInputValue(value));
  }, [value, decimals]);

  const commitDraft = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(formatInputValue(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    const snapped = Math.round((clamped - min) / step) * step + min;
    const next = Number(snapped.toFixed(Math.max(0, decimals + 2)));
    onChange(next);
    setDraft(formatInputValue(next));
  };

  return (
    <div className="rounded-panel border border-app-border bg-app-surface/60 px-3 py-3">
      <label htmlFor={id} className="mb-2 flex items-center justify-between gap-2">
        <span className="min-w-0 text-[13px] font-medium tracking-[0.01em] text-app-text/90">
          {label}
          <InfoHint text={hint} />
        </span>
        <span className="shrink-0 font-chrome text-[13px] text-app-text">{formatter ? formatter(value) : value.toFixed(2)}</span>
      </label>
      <div className="mb-2 flex justify-end">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitDraft();
              (event.target as HTMLInputElement).blur();
            }
          }}
          className="h-7 w-24 rounded border border-app-border bg-app-bg/80 px-2 text-right font-mono text-xs text-app-text outline-none focus:border-app-accent"
          aria-label={`${label} numeric input`}
        />
      </div>
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
