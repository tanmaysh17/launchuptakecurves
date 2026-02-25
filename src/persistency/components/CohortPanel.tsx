import { useMemo } from "react";
import type { CurveModel, ModelParams, CohortMonth } from "../types";
import { simulateCohort } from "../lib/cohort";
import { CohortChart } from "./chart/CohortChart";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { ParameterSlider } from "../../components/ui/ParameterSlider";

interface CohortPanelProps {
  expanded: boolean;
  onToggle: () => void;
  model: CurveModel;
  params: ModelParams;
  newStarts: number;
  simMonths: number;
  onSetNewStarts: (v: number) => void;
  onSetSimMonths: (v: number) => void;
}

export function CohortPanel({
  expanded,
  onToggle,
  model,
  params,
  newStarts,
  simMonths,
  onSetNewStarts,
  onSetSimMonths
}: CohortPanelProps) {
  const cohortData = useMemo<CohortMonth[]>(
    () => (expanded ? simulateCohort(model, params, newStarts, simMonths) : []),
    [expanded, model, params, newStarts, simMonths]
  );

  const peakPatients = cohortData.length > 0
    ? Math.max(...cohortData.map((d) => d.totalOnDrug))
    : 0;

  return (
    <div className="rounded-panel border border-app-border bg-app-surface p-3">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between"
      >
        <SectionLabel>Cohort Waterfall Simulation</SectionLabel>
        <span className="font-chrome text-[11px] text-app-muted">{expanded ? "[-]" : "[+]"}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <ParameterSlider
              id="cohort-starts"
              label="New Starts/Month"
              value={newStarts}
              min={10}
              max={1000}
              step={10}
              onChange={onSetNewStarts}
              hint="Number of new patients starting therapy each month."
              formatter={(v) => `${v.toFixed(0)}`}
            />
            <ParameterSlider
              id="cohort-months"
              label="Simulation Months"
              value={simMonths}
              min={6}
              max={60}
              step={1}
              onChange={onSetSimMonths}
              hint="Total months to simulate."
              formatter={(v) => `${v.toFixed(0)} mo`}
            />
          </div>

          <CohortChart data={cohortData} />

          <div className="flex gap-4 text-xs text-app-muted">
            <span>Peak on-drug: <strong className="text-app-text">{Math.round(peakPatients)}</strong> patients</span>
            <span>Steady-state approx. month: <strong className="text-app-text">{cohortData.length > 0 ? cohortData.length - 1 : "--"}</strong></span>
          </div>

          {cohortData.length > 0 && (
            <div className="max-h-48 overflow-auto rounded border border-app-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-app-elevated">
                  <tr>
                    <th className="px-2 py-1 text-left font-chrome text-[10px] uppercase text-app-muted">Month</th>
                    <th className="px-2 py-1 text-right font-chrome text-[10px] uppercase text-app-muted">Total on Drug</th>
                    <th className="px-2 py-1 text-right font-chrome text-[10px] uppercase text-app-muted">New Starts</th>
                    <th className="px-2 py-1 text-right font-chrome text-[10px] uppercase text-app-muted">Discontinuations</th>
                  </tr>
                </thead>
                <tbody>
                  {cohortData.map((m, i) => {
                    const prevTotal = i > 0 ? cohortData[i - 1].totalOnDrug : 0;
                    const discon = i > 0 ? prevTotal + newStarts - m.totalOnDrug : 0;
                    return (
                      <tr key={m.month} className="border-t border-app-border/30">
                        <td className="px-2 py-0.5 text-app-text">{m.month}</td>
                        <td className="px-2 py-0.5 text-right text-app-text">{Math.round(m.totalOnDrug)}</td>
                        <td className="px-2 py-0.5 text-right text-app-muted">{newStarts}</td>
                        <td className="px-2 py-0.5 text-right text-app-muted">{Math.round(Math.max(0, discon))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
