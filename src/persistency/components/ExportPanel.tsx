import type { SurvivalPoint, CurveModel, ModelParams, CohortMonth } from "../types";
import { todayStamp } from "../../lib/format";

interface ExportPanelProps {
  open: boolean;
  onClose: () => void;
  series: SurvivalPoint[];
  cohortData: CohortMonth[];
  model: CurveModel;
  params: ModelParams;
  onToast: (msg: string) => void;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportPanel({ open, onClose, series, cohortData, model, params, onToast }: ExportPanelProps) {
  if (!open) return null;

  const exportCurveCsv = () => {
    const header = "Month,Survival%,Hazard";
    const rows = series.map((pt) => `${pt.month},${pt.survival.toFixed(2)},${pt.hazard.toFixed(6)}`);
    downloadBlob([header, ...rows].join("\n"), `persistency-curve-${todayStamp()}.csv`, "text/csv");
    onToast("Curve CSV downloaded.");
  };

  const exportCohortCsv = () => {
    if (cohortData.length === 0) {
      onToast("No cohort data. Expand the cohort panel first.");
      return;
    }
    const header = "Month,TotalOnDrug";
    const rows = cohortData.map((m) => `${m.month},${m.totalOnDrug.toFixed(2)}`);
    downloadBlob([header, ...rows].join("\n"), `cohort-simulation-${todayStamp()}.csv`, "text/csv");
    onToast("Cohort CSV downloaded.");
  };

  const exportJson = () => {
    const payload = {
      model,
      params: params[model],
      exportedAt: todayStamp()
    };
    downloadBlob(JSON.stringify(payload, null, 2), `persistency-params-${todayStamp()}.json`, "application/json");
    onToast("Parameters JSON downloaded.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-panel border border-app-border bg-app-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-chrome text-sm uppercase tracking-wider text-app-text">Export</h3>
          <button
            onClick={onClose}
            className="text-app-muted hover:text-app-text text-lg leading-none"
          >
            x
          </button>
        </div>
        <div className="space-y-3">
          <button
            onClick={exportCurveCsv}
            className="w-full rounded border border-app-border px-4 py-2.5 text-left hover:border-app-accent hover:bg-app-elevated transition-colors"
          >
            <div className="font-chrome text-xs uppercase tracking-wider text-app-accent">Curve CSV</div>
            <div className="mt-0.5 text-[11px] text-app-muted">Month, Survival%, Hazard rate for each period</div>
          </button>
          <button
            onClick={exportCohortCsv}
            className="w-full rounded border border-app-border px-4 py-2.5 text-left hover:border-app-accent hover:bg-app-elevated transition-colors"
          >
            <div className="font-chrome text-xs uppercase tracking-wider text-app-accent">Cohort CSV</div>
            <div className="mt-0.5 text-[11px] text-app-muted">Monthly total patients on drug from cohort simulation</div>
          </button>
          <button
            onClick={exportJson}
            className="w-full rounded border border-app-border px-4 py-2.5 text-left hover:border-app-accent hover:bg-app-elevated transition-colors"
          >
            <div className="font-chrome text-xs uppercase tracking-wider text-app-accent">Parameters JSON</div>
            <div className="mt-0.5 text-[11px] text-app-muted">Model type and parameter values for programmatic use</div>
          </button>
        </div>
      </div>
    </div>
  );
}
