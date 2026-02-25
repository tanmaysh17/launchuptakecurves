import { SectionLabel } from "../../components/ui/SectionLabel";
import { computeSeries } from "../lib/curves";
import { PRESETS } from "../lib/presets";
import type { ModelParams, SurvivalPoint } from "../types";
import { initialState } from "../state/reducer";

export interface BenchmarkSeries {
  id: string;
  label: string;
  color: string;
  series: SurvivalPoint[];
}

const BENCHMARK_COLORS = [
  "rgb(var(--app-amber))",
  "rgb(var(--app-purple))",
  "rgb(var(--app-success))",
  "#e06666",
  "#6fa8dc",
  "#93c47d"
];

interface BenchmarkTogglesProps {
  enabled: { id: string; enabled: boolean }[];
  onToggle: (id: string) => void;
}

export function BenchmarkToggles({ enabled, onToggle }: BenchmarkTogglesProps) {
  return (
    <div>
      <SectionLabel>Benchmark Overlays</SectionLabel>
      <div className="space-y-1">
        {PRESETS.map((preset, i) => {
          const isOn = enabled.find((b) => b.id === preset.id)?.enabled ?? false;
          return (
            <label key={preset.id} className="flex items-center gap-2 cursor-pointer text-xs text-app-text">
              <input
                type="checkbox"
                checked={isOn}
                onChange={() => onToggle(preset.id)}
                className="accent-[rgb(var(--app-accent))]"
              />
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: BENCHMARK_COLORS[i % BENCHMARK_COLORS.length] }}
              />
              <span className={isOn ? "text-app-text" : "text-app-muted"}>{preset.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/** Generate series for all enabled benchmarks */
export function getEnabledBenchmarkSeries(
  enabled: { id: string; enabled: boolean }[],
  horizon: number
): BenchmarkSeries[] {
  const results: BenchmarkSeries[] = [];
  const activeIds = enabled.filter((b) => b.enabled).map((b) => b.id);

  for (const id of activeIds) {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) continue;
    const idx = PRESETS.indexOf(preset);
    // Build a full ModelParams from the preset's partial params
    const fullParams: ModelParams = { ...initialState.params };
    switch (preset.model) {
      case "weibull":
        fullParams.weibull = preset.params as ModelParams["weibull"];
        break;
      case "exponential":
        fullParams.exponential = preset.params as ModelParams["exponential"];
        break;
      case "logNormal":
        fullParams.logNormal = preset.params as ModelParams["logNormal"];
        break;
      case "piecewise":
        fullParams.piecewise = preset.params as ModelParams["piecewise"];
        break;
      case "mixtureCure":
        fullParams.mixtureCure = preset.params as ModelParams["mixtureCure"];
        break;
    }
    results.push({
      id: preset.id,
      label: preset.label,
      color: BENCHMARK_COLORS[idx % BENCHMARK_COLORS.length],
      series: computeSeries(preset.model, fullParams, horizon)
    });
  }
  return results;
}
