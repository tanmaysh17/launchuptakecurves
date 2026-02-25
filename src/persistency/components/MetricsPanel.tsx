import type { PersistencyMetrics } from "../lib/metrics";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { ParameterSlider } from "../../components/ui/ParameterSlider";

interface MetricsPanelProps {
  metrics: PersistencyMetrics;
  monthlyDose: number;
  onSetMonthlyDose: (value: number) => void;
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

export function MetricsPanel({ metrics, monthlyDose, onSetMonthlyDose }: MetricsPanelProps) {
  const interpretive = metrics.medianDoT != null
    ? `Half of patients discontinue by month ${metrics.medianDoT.toFixed(1)}. Average time on therapy is ${metrics.meanDoT.toFixed(1)} months.`
    : `Median DoT not reached within horizon. Average time on therapy is ${metrics.meanDoT.toFixed(1)} months.`;

  return (
    <div>
      <SectionLabel>Business Metrics</SectionLabel>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatCard label="Median DoT" value={metrics.medianDoT != null ? metrics.medianDoT.toFixed(1) : "NR"} unit="mo" />
        <StatCard label="Mean DoT" value={metrics.meanDoT.toFixed(1)} unit="mo" />
        <StatCard label="S(6)" value={metrics.survivalAt6 != null ? `${metrics.survivalAt6.toFixed(1)}` : "--"} unit="%" />
        <StatCard label="S(12)" value={metrics.survivalAt12 != null ? `${metrics.survivalAt12.toFixed(1)}` : "--"} unit="%" />
        <StatCard label="S(24)" value={metrics.survivalAt24 != null ? `${metrics.survivalAt24.toFixed(1)}` : "--"} unit="%" />
        <StatCard
          label="Annual Vials/Pt"
          value={metrics.annualVials != null ? metrics.annualVials.toFixed(1) : "--"}
        />
      </div>
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
