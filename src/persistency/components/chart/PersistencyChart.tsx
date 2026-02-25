import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { KMDataPoint, SurvivalPoint } from "../../types";
import type { BenchmarkSeries } from "../BenchmarkToggles";

interface PersistencyChartProps {
  series: SurvivalPoint[];
  kmData: KMDataPoint[];
  benchmarkSeries: BenchmarkSeries[];
  medianDoT: number | null;
}

export function PersistencyChart({ series, kmData, benchmarkSeries, medianDoT }: PersistencyChartProps) {
  const chartData = series.map((pt) => {
    const row: Record<string, number> = { month: pt.month, survival: pt.survival };
    for (const bm of benchmarkSeries) {
      const bmPt = bm.series.find((s) => s.month === pt.month);
      if (bmPt) row[bm.id] = bmPt.survival;
    }
    return row;
  });

  return (
    <div id="persistency-chart-capture" className="rounded-panel border border-app-border bg-app-surface p-3">
      <ResponsiveContainer width="100%" height={380}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <defs>
            <linearGradient id="survGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgb(var(--app-accent))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="rgb(var(--app-accent))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--app-border))" strokeOpacity={0.5} />
          <XAxis
            dataKey="month"
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
            formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name === "survival" ? "S(t)" : name]}
            labelFormatter={(label) => `Month ${label}`}
          />
          {/* Benchmark overlays */}
          {benchmarkSeries.map((bm) => (
            <Area
              key={bm.id}
              type="monotone"
              dataKey={bm.id}
              stroke={bm.color}
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              name={bm.label}
            />
          ))}
          {/* Main survival curve */}
          <Area
            type="monotone"
            dataKey="survival"
            stroke="rgb(var(--app-accent))"
            fill="url(#survGradient)"
            strokeWidth={2.5}
            dot={false}
            name="S(t)"
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
          {/* 50% reference line */}
          <ReferenceLine
            y={50}
            stroke="rgb(var(--app-muted))"
            strokeDasharray="2 4"
            strokeOpacity={0.5}
          />
          {/* KM scatter data */}
          {kmData.length > 0 && (
            <Scatter
              data={kmData.map((d) => ({ month: d.month, survival: d.survival }))}
              fill="rgb(var(--app-purple))"
              stroke="rgb(var(--app-purple))"
              strokeWidth={1}
              r={4}
              name="KM Data"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
