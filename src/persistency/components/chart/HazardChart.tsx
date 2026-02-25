import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { SurvivalPoint } from "../../types";

interface HazardChartProps {
  series: SurvivalPoint[];
}

export function HazardChart({ series }: HazardChartProps) {
  const data = series.map((pt) => ({
    month: pt.month,
    hazard: pt.hazard
  }));

  const maxHazard = Math.max(...data.map((d) => d.hazard).filter(Number.isFinite), 0.1);

  return (
    <div className="rounded-panel border border-app-border bg-app-surface p-3">
      <ResponsiveContainer width="100%" height={380}>
        <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <defs>
            <linearGradient id="hazGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgb(var(--app-purple))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="rgb(var(--app-purple))" stopOpacity={0.02} />
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
            domain={[0, Math.ceil(maxHazard * 10) / 10]}
            stroke="rgb(var(--app-muted))"
            tick={{ fontSize: 11, fontFamily: "monospace" }}
            label={{ value: "Hazard Rate h(t)", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 11, fill: "rgb(var(--app-muted))" } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--app-surface))",
              border: "1px solid rgb(var(--app-border))",
              borderRadius: 6,
              fontSize: 12,
              fontFamily: "monospace"
            }}
            formatter={(value: number) => [value.toFixed(4), "h(t)"]}
            labelFormatter={(label) => `Month ${label}`}
          />
          <Area
            type="monotone"
            dataKey="hazard"
            stroke="rgb(var(--app-purple))"
            fill="url(#hazGradient)"
            strokeWidth={2}
            dot={false}
            name="h(t)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
