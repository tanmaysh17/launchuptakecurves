import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { CohortMonth } from "../../types";

interface CohortChartProps {
  data: CohortMonth[];
}

const COHORT_COLORS = [
  "rgb(var(--app-accent))",
  "rgb(var(--app-purple))",
  "rgb(var(--app-amber))",
  "rgb(var(--app-success))",
  "#e06666",
  "#6fa8dc",
  "#93c47d",
  "#f6b26b",
  "#8e7cc3",
  "#c27ba0"
];

const MAX_DISPLAY_COHORTS = 10;

export function CohortChart({ data }: CohortChartProps) {
  if (data.length === 0) return null;

  // Determine how many individual cohorts to show vs bundle into "other"
  const totalCohorts = data[data.length - 1].cohortContributions.length;
  const displayCohorts = Math.min(totalCohorts, MAX_DISPLAY_COHORTS);
  const hasOther = totalCohorts > displayCohorts;

  // Build stable keys that exist on every row
  const cohortKeys: string[] = [];
  for (let c = 0; c < displayCohorts; c++) {
    cohortKeys.push(`cohort_${c}`);
  }
  if (hasOther) {
    cohortKeys.push("cohort_other");
  }

  // Build chart data — ensure every row has every key (0 if cohort hasn't started yet)
  const chartData = data.map((m) => {
    const row: Record<string, number> = { month: m.month };
    for (let c = 0; c < displayCohorts; c++) {
      row[`cohort_${c}`] = c < m.cohortContributions.length ? m.cohortContributions[c] : 0;
    }
    if (hasOther) {
      let remainder = 0;
      for (let c = displayCohorts; c < m.cohortContributions.length; c++) {
        remainder += m.cohortContributions[c];
      }
      row["cohort_other"] = remainder;
    }
    return row;
  });

  const maxTotal = Math.max(...data.map((d) => d.totalOnDrug), 1);

  return (
    <div className="rounded-panel border border-app-border bg-app-surface p-3">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--app-border))" strokeOpacity={0.5} />
          <XAxis
            dataKey="month"
            stroke="rgb(var(--app-muted))"
            tick={{ fontSize: 11, fontFamily: "monospace" }}
            label={{ value: "Months", position: "insideBottom", offset: -5, style: { fontSize: 11, fill: "rgb(var(--app-muted))" } }}
          />
          <YAxis
            domain={[0, Math.ceil(maxTotal * 1.1)]}
            stroke="rgb(var(--app-muted))"
            tick={{ fontSize: 11, fontFamily: "monospace" }}
            label={{ value: "Patients on Drug", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 11, fill: "rgb(var(--app-muted))" } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--app-surface))",
              border: "1px solid rgb(var(--app-border))",
              borderRadius: 6,
              fontSize: 11,
              fontFamily: "monospace",
              maxHeight: 200,
              overflowY: "auto"
            }}
            labelFormatter={(label) => `Month ${label}`}
            formatter={(value: number, name: string) => {
              if (value === 0) return null;
              const label = name === "cohort_other"
                ? "Older Cohorts"
                : name.startsWith("cohort_")
                  ? `Cohort ${parseInt(name.split("_")[1]) + 1}`
                  : name;
              return [Math.round(value).toLocaleString(), label];
            }}
            itemSorter={(item) => -(item.value as number)}
          />
          {/* Render in reverse order so cohort 0 (oldest at any point) is at the bottom */}
          {[...cohortKeys].reverse().map((key) => {
            const colorIdx = key === "cohort_other"
              ? COHORT_COLORS.length - 1
              : parseInt(key.split("_")[1]) % COHORT_COLORS.length;
            return (
              <Area
                key={key}
                type="stepAfter"
                dataKey={key}
                stackId="cohorts"
                stroke={COHORT_COLORS[colorIdx]}
                fill={COHORT_COLORS[colorIdx]}
                fillOpacity={0.65}
                strokeWidth={0}
                name={key}
                isAnimationActive={false}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
