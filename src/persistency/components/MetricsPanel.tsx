import type { PersistencyMetrics } from "../lib/metrics";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { ParameterSlider } from "../../components/ui/ParameterSlider";

export interface ScenarioMetrics {
  name: string;
  color: string;
  metrics: PersistencyMetrics;
}

interface MetricsPanelProps {
  metrics: PersistencyMetrics;
  scenarioMetrics: ScenarioMetrics[];
  monthlyDose: number;
  onSetMonthlyDose: (value: number) => void;
}

function fmt(v: number | null, fallback = "--"): string {
  return v != null ? v.toFixed(1) : fallback;
}

function StatCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-panel border border-app-border bg-app-surface/60 px-3 py-2.5">
      <div className="font-chrome text-[10px] uppercase tracking-wider text-app-muted">{label}</div>
      <div className="mt-1 font-chrome text-lg text-app-text">
        {value}
        {unit && <span className="ml-1 text-xs text-app-muted">{unit}</span>}
      </div>
    </div>
  );
}

const METRIC_ROWS: { key: keyof PersistencyMetrics; label: string; unit: string; fallback?: string }[] = [
  { key: "medianDoT", label: "Median DoT", unit: "mo", fallback: "NR" },
  { key: "meanDoT", label: "Mean DoT", unit: "mo" },
  { key: "survivalAt6", label: "S(6)", unit: "%" },
  { key: "survivalAt12", label: "S(12)", unit: "%" },
  { key: "survivalAt24", label: "S(24)", unit: "%" },
  { key: "annualVials", label: "Annual Vials/Pt", unit: "" },
];

export function MetricsPanel({ metrics, scenarioMetrics, monthlyDose, onSetMonthlyDose }: MetricsPanelProps) {
  const hasScenarios = scenarioMetrics.length > 0;

  const interpretive = metrics.medianDoT != null
    ? `Half of patients discontinue by month ${metrics.medianDoT.toFixed(1)}. Average time on therapy is ${metrics.meanDoT.toFixed(1)} months.`
    : `Median DoT not reached within horizon. Average time on therapy is ${metrics.meanDoT.toFixed(1)} months.`;

  return (
    <div>
      <SectionLabel>Business Metrics</SectionLabel>

      {hasScenarios ? (
        /* Comparison table when scenarios exist */
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-app-border">
                <th className="py-1.5 pr-2 text-left font-chrome text-[10px] uppercase tracking-wider text-app-muted">Metric</th>
                <th className="py-1.5 px-2 text-right font-chrome text-[10px] uppercase tracking-wider text-app-accent">Active</th>
                {scenarioMetrics.map((sc) => (
                  <th key={sc.name} className="py-1.5 px-2 text-right font-chrome text-[10px] uppercase tracking-wider" style={{ color: sc.color }}>
                    {sc.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_ROWS.map((row) => (
                <tr key={row.key} className="border-b border-app-border/50">
                  <td className="py-1.5 pr-2 font-chrome text-[10px] uppercase tracking-wider text-app-muted">
                    {row.label}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-app-text">
                    {fmt(metrics[row.key] as number | null, row.fallback)}{row.unit && <span className="text-app-muted ml-0.5">{row.unit}</span>}
                  </td>
                  {scenarioMetrics.map((sc) => (
                    <td key={sc.name} className="py-1.5 px-2 text-right font-mono text-app-text">
                      {fmt(sc.metrics[row.key] as number | null, row.fallback)}{row.unit && <span className="text-app-muted ml-0.5">{row.unit}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Original stat cards when no scenarios */
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatCard label="Median DoT" value={fmt(metrics.medianDoT, "NR")} unit="mo" />
            <StatCard label="Mean DoT" value={metrics.meanDoT.toFixed(1)} unit="mo" />
            <StatCard label="S(6)" value={fmt(metrics.survivalAt6)} unit="%" />
            <StatCard label="S(12)" value={fmt(metrics.survivalAt12)} unit="%" />
            <StatCard label="S(24)" value={fmt(metrics.survivalAt24)} unit="%" />
            <StatCard label="Annual Vials/Pt" value={fmt(metrics.annualVials)} />
          </div>
        </>
      )}

      <p className="mt-2 text-[11px] text-app-muted">{interpretive}</p>
      <div className="mt-3">
        <ParameterSlider
          id="monthly-dose"
          label="Monthly Doses"
          value={monthlyDose}
          min={0}
          max={12}
          step={0.5}
          onChange={onSetMonthlyDose}
          hint="Number of doses/vials per month. Used to estimate annual vials per patient."
          formatter={(v) => v.toFixed(1)}
        />
      </div>
    </div>
  );
}
