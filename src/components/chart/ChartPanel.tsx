import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { BassView, ChartMode, CurvePoint, Milestones, ModelType, ObservedPoint, OutputUnit, TimeUnit } from "../../types";
import { inflectionTextForRichards } from "../../lib/models";
import { fmtPct, fmtVolume } from "../../lib/format";
import { PillTabs } from "../ui/PillTabs";

interface ScenarioSeries {
  id: string;
  name: string;
  color: string;
  points: CurvePoint[];
}

interface ChartPanelProps {
  model: ModelType;
  points: CurvePoint[];
  scenarios: ScenarioSeries[];
  milestones: Milestones;
  chartMode: ChartMode;
  bassView: BassView;
  outputUnit: OutputUnit;
  tam: number | null;
  timeUnit: TimeUnit;
  richardsNu: number;
  observed: ObservedPoint[];
  onSetChartMode: (mode: ChartMode) => void;
  onSetBassView: (view: BassView) => void;
  onCopyChart: () => void;
  onShare: () => void;
}

interface ChartRow {
  period: number;
  label: string;
  active: number;
  activeCumulative: number;
  activeGrowth: number;
  [key: string]: string | number;
}

const CHART_COLORS = {
  accent: "rgb(var(--app-accent))",
  amber: "rgb(var(--app-amber))",
  muted: "rgb(var(--app-muted))",
  border: "rgb(var(--app-border))",
  text: "rgb(var(--app-text))"
};

function extractValue(point: CurvePoint, mode: ChartMode, outputUnit: OutputUnit): number {
  if (outputUnit === "percent") {
    return mode === "cumulative" ? point.cumulativePct : point.incrementalPct;
  }
  return mode === "cumulative" ? (point.cumulativeVolume ?? 0) : (point.incrementalVolume ?? 0);
}

function yDomain(points: CurvePoint[], scenarios: ScenarioSeries[], mode: ChartMode, outputUnit: OutputUnit, tam: number | null): [number, number] {
  if (mode === "cumulative" && outputUnit === "percent") {
    return [0, 105];
  }
  if (mode === "cumulative" && outputUnit === "volume" && tam != null) {
    return [0, tam * 1.05];
  }
  let max = 0;
  for (const p of points) {
    max = Math.max(max, extractValue(p, mode, outputUnit));
  }
  for (const scenario of scenarios) {
    for (const p of scenario.points) {
      max = Math.max(max, extractValue(p, mode, outputUnit));
    }
  }
  return [0, max * 1.1 || 1];
}

function tickFormatterY(value: number, outputUnit: OutputUnit): string {
  return outputUnit === "percent" ? `${value.toFixed(0)}%` : fmtVolume(value);
}

function tickFormatterX(value: number, unit: TimeUnit): string {
  return `${unit === "months" ? "M" : "W"}${value}`;
}

function formatValue(value: number, outputUnit: OutputUnit): string {
  return outputUnit === "percent" ? fmtPct(value) : fmtVolume(value);
}

function makeTicks(horizon: number): number[] {
  const targetTicks = 12;
  const step = Math.max(1, Math.ceil(horizon / targetTicks));
  const ticks: number[] = [];
  for (let i = 1; i <= horizon; i += step) {
    ticks.push(i);
  }
  if (ticks[ticks.length - 1] !== horizon) {
    ticks.push(horizon);
  }
  return ticks;
}

export function ChartPanel({
  model,
  points,
  scenarios,
  milestones,
  chartMode,
  bassView,
  outputUnit,
  tam,
  timeUnit,
  richardsNu,
  observed,
  onSetChartMode,
  onSetBassView,
  onCopyChart,
  onShare
}: ChartPanelProps) {
  const rows: ChartRow[] = points.map((point, index) => {
    const row: ChartRow = {
      period: point.period,
      label: point.label,
      active: extractValue(point, chartMode, outputUnit),
      activeCumulative: extractValue(point, "cumulative", outputUnit),
      activeGrowth: extractValue(point, "growth", outputUnit)
    };
    scenarios.forEach((scenario) => {
      row[`scenario_${scenario.id}`] = extractValue(scenario.points[index], chartMode, outputUnit);
      row[`scenarioRate_${scenario.id}`] = extractValue(scenario.points[index], "growth", outputUnit);
    });
    return row;
  });

  const observedPoints =
    chartMode === "cumulative"
      ? observed.map((p) => ({
          period: p.period,
          value: outputUnit === "percent" ? p.adoptionPct : ((tam ?? 0) * p.adoptionPct) / 100
        }))
      : [];

  const domain = yDomain(points, scenarios, chartMode, outputUnit, tam);
  const ticks = makeTicks(points.length);

  const milestoneLines = [
    { period: milestones.reach10, label: "10%", color: CHART_COLORS.accent },
    { period: milestones.reach50, label: "50%", color: CHART_COLORS.amber },
    { period: milestones.reach90, label: "90%", color: CHART_COLORS.muted }
  ];

  return (
    <div className="rounded-panel border border-app-border bg-app-surface p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h2 className="font-chrome text-[11px] uppercase tracking-[0.1em] text-app-muted">Chart</h2>
          <div className="inline-flex items-center gap-1 rounded-full border border-app-border px-2 py-0.5 font-chrome text-[10px] uppercase text-app-success">
            <span className="inline-block h-2 w-2 rounded-full bg-app-success animate-pulseDot" />
            Live
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PillTabs<ChartMode>
            value={chartMode}
            onChange={onSetChartMode}
            options={[
              { key: "cumulative", label: "Cumulative" },
              { key: "growth", label: "Growth Rate" }
            ]}
          />
          {model === "bass" && (
            <PillTabs<BassView>
              value={bassView}
              onChange={onSetBassView}
              options={[
                { key: "cumulativeOnly", label: "Cum Only" },
                { key: "cumulativePlusRate", label: "Cum + Rate" }
              ]}
            />
          )}
          <button
            type="button"
            onClick={onCopyChart}
            className="rounded border border-app-border px-2 py-1 font-chrome text-[10px] uppercase tracking-[0.08em] text-app-text hover:border-app-accent hover:text-app-accent"
          >
            Copy Chart
          </button>
          <button
            type="button"
            onClick={onShare}
            className="rounded border border-app-border px-2 py-1 font-chrome text-[10px] uppercase tracking-[0.08em] text-app-text hover:border-app-accent hover:text-app-accent"
          >
            Share
          </button>
        </div>
      </div>
      <div id="chart-capture" className="h-[360px] w-full rounded-panel bg-app-bg/60 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 24, right: 16, left: 8, bottom: 8 }}>
            <defs>
              <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.26} />
                <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_COLORS.border} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="period"
              ticks={ticks}
              tickFormatter={(v) => tickFormatterX(v, timeUnit)}
              tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
              stroke={CHART_COLORS.border}
            />
            <YAxis
              domain={domain}
              tickFormatter={(v) => tickFormatterY(v, outputUnit)}
              tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
              stroke={CHART_COLORS.border}
              width={70}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) {
                  return null;
                }
                const row = payload[0].payload as ChartRow;
                return (
                  <div className="rounded-panel border border-app-border bg-app-surface px-3 py-2 text-xs text-app-text">
                    <div className="font-chrome uppercase tracking-[0.08em] text-app-muted">
                      {timeUnit === "months" ? "Month" : "Week"} {label}
                    </div>
                    <div className="mt-1">Cumulative: {formatValue(row.activeCumulative, outputUnit)}</div>
                    <div>Incremental: {formatValue(row.activeGrowth, outputUnit)}</div>
                  </div>
                );
              }}
            />

            {milestoneLines.map((line) =>
              line.period ? (
                <ReferenceLine
                  key={line.label}
                  x={line.period}
                  stroke={line.color}
                  strokeDasharray="5 5"
                  label={{
                    value: line.label,
                    position: "insideTop",
                    fill: line.color,
                    fontSize: 10
                  }}
                />
              ) : null
            )}
            {chartMode === "cumulative" && outputUnit === "percent" && (
              <ReferenceLine y={100} stroke={CHART_COLORS.muted} strokeDasharray="4 4" />
            )}

            {chartMode === "cumulative" && (
              <Area
                type="monotone"
                dataKey="active"
                stroke="none"
                fill="url(#lineFill)"
                isAnimationActive
                animationDuration={300}
              />
            )}

            <Line
              type="monotone"
              dataKey="active"
              name={chartMode === "cumulative" ? "Cumulative" : "Growth"}
              stroke={CHART_COLORS.accent}
              strokeWidth={2.5}
              dot={false}
              fill="url(#lineFill)"
              isAnimationActive
              animationDuration={300}
            />

            {scenarios.map((scenario) => (
              <Line
                key={scenario.id}
                type="monotone"
                dataKey={`scenario_${scenario.id}`}
                name={scenario.name}
                stroke={scenario.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive
                animationDuration={300}
              />
            ))}

            {model === "bass" && chartMode === "cumulative" && bassView === "cumulativePlusRate" && (
              <Line
                type="monotone"
                dataKey="activeGrowth"
                name="Bass Periodic Rate"
                stroke={CHART_COLORS.amber}
                strokeWidth={2}
                dot={false}
                isAnimationActive
                animationDuration={300}
              />
            )}

            {observedPoints.length > 0 && (
              <Scatter
                data={observedPoints}
                dataKey="value"
                xAxisId={0}
                yAxisId={0}
                fill={CHART_COLORS.text}
                name="Observed Data"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {model === "richards" && (
        <div className="mt-2 inline-flex rounded border border-app-purple/60 bg-[rgb(var(--app-purple)/0.1)] px-2 py-1 text-xs text-app-purple">
          {inflectionTextForRichards(richardsNu)}
        </div>
      )}
      {chartMode === "growth" && (
        <p className="mt-2 text-[11px] text-app-muted">Growth rate view shows incremental adoption per period.</p>
      )}
    </div>
  );
}
