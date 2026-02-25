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
import type { KMDataPoint, SurvivalPoint } from "../../types";
import type { BenchmarkSeries } from "../BenchmarkToggles";

export interface ScenarioChartSeries {
  id: string;
  name: string;
  color: string;
  series: SurvivalPoint[];
}

interface PersistencyChartProps {
  series: SurvivalPoint[];
  kmData: KMDataPoint[];
  benchmarkSeries: BenchmarkSeries[];
  scenarioSeries: ScenarioChartSeries[];
  medianDoT: number | null;
}

export function PersistencyChart({ series, kmData, benchmarkSeries, scenarioSeries, medianDoT }: PersistencyChartProps) {
  const chartData = series.map((pt) => {
    const row: Record<string, number> = { month: pt.month, survival: pt.survival };
    for (const bm of benchmarkSeries) {
      const bmPt = bm.series.find((s) => s.month === pt.month);
      if (bmPt) row[bm.id] = bmPt.survival;
    }
    for (const sc of scenarioSeries) {
      const scPt = sc.series.find((s) => s.month === pt.month);
      if (scPt) row[`sc_${sc.id}`] = scPt.survival;
    }
    return row;
  });

  return (
    <div id="persistency-chart-capture" className="rounded-panel border border-app-border bg-app-surface p-3">
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <defs>
            <linearGradient id="survGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgb(var(--app-accent))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="rgb(var(--app-accent))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--app-border))" strokeOpacity={0.5} />
          <XAxis
            dataKey="month"
            type="number"
            stroke="rgb(var(--app-muted))"
            tick={{ fontSize: 11, fontFamily: "monospace" }}
            label={{ value: "Months", position: "insideBottom", offset: -5, style: { fontSize: 11, fill: "rgb(var(--app-muted))" } }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="rgb(var(--app-muted))"
            tick={{ fontSize: 11, fontFamily: "monospace" }}
            label={{ value: "% Remaining on Therapy", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 11, fill: "rgb(var(--app-muted))" } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--app-surface))",
              border: "1px solid rgb(var(--app-border))",
              borderRadius: 6,
              fontSize: 12,
              fontFamily: "monospace"
            }}
            formatter={(value: number, name: string) => {
              if (name === "survival") return [`${value.toFixed(1)}%`, "S(t) — Active"];
              const sc = scenarioSeries.find((s) => `sc_${s.id}` === name);
              if (sc) return [`${value.toFixed(1)}%`, sc.name];
              return [`${value.toFixed(1)}%`, name];
            }}
            labelFormatter={(label) => `Month ${label}`}
          />
          {/* 50% reference line */}
          <ReferenceLine
            y={50}
            stroke="rgb(var(--app-muted))"
            strokeDasharray="2 4"
            strokeOpacity={0.5}
          />
          {/* Median DoT reference line */}
          {medianDoT != null && (
            <ReferenceLine
              x={Math.round(medianDoT * 10) / 10}
              stroke="rgb(var(--app-amber))"
              strokeDasharray="5 3"
              label={{
                value: `Median ${medianDoT.toFixed(1)}mo`,
                position: "top",
                style: { fontSize: 10, fontFamily: "monospace", fill: "rgb(var(--app-amber))" }
              }}
            />
          )}
          {/* Benchmark overlays (dashed) */}
          {benchmarkSeries.map((bm) => (
            <Line
              key={bm.id}
              type="monotone"
              dataKey={bm.id}
              stroke={bm.color}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              name={bm.label}
              isAnimationActive={false}
            />
          ))}
          {/* Main survival curve (filled area) */}
          <Area
            type="monotone"
            dataKey="survival"
            stroke="rgb(var(--app-accent))"
            fill="url(#survGradient)"
            strokeWidth={2.5}
            dot={false}
            name="survival"
            isAnimationActive={false}
          />
          {/* Scenario overlays (solid lines) */}
          {scenarioSeries.map((sc) => (
            <Line
              key={`sc_${sc.id}`}
              type="monotone"
              dataKey={`sc_${sc.id}`}
              stroke={sc.color}
              strokeWidth={2.5}
              dot={false}
              name={`sc_${sc.id}`}
              isAnimationActive={false}
            />
          ))}
          {/* KM scatter data */}
          {kmData.length > 0 && (
            <Scatter
              data={kmData.map((d) => ({ month: d.month, survival: d.survival }))}
              fill="rgb(var(--app-purple))"
              stroke="rgb(var(--app-purple))"
              strokeWidth={1}
              name="KM Data"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
