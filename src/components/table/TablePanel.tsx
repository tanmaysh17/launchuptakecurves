import clsx from "clsx";
import type { CurvePoint, Milestones, ModelType, TableSortState, TimeUnit } from "../../types";
import { fmtPct, fmtVolume, todayStamp } from "../../lib/format";
import { serializeRowsToCsv, serializeRowsToTsv } from "../../lib/csv";
import { MODEL_LABELS } from "../../lib/models";

interface ScenarioSeries {
  id: string;
  name: string;
  points: CurvePoint[];
}

interface TablePanelProps {
  model: ModelType;
  points: CurvePoint[];
  scenarios: ScenarioSeries[];
  milestones: Milestones;
  tam: number | null;
  timeUnit: TimeUnit;
  sort: TableSortState;
  onSort: (sort: TableSortState) => void;
  onCopyChart: () => void;
}

interface Row {
  period: number;
  cumulativePct: number;
  incrementalPct: number;
  cumulativeVolume: number | null;
  incrementalVolume: number | null;
  scenario: Record<string, number>;
}

function sortRows(rows: Row[], sort: TableSortState): Row[] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    const av = valueByKey(a, sort.key);
    const bv = valueByKey(b, sort.key);
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sort.dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

function valueByKey(row: Row, key: string): number {
  if (key === "period") return row.period;
  if (key === "cumulativePct") return row.cumulativePct;
  if (key === "incrementalPct") return row.incrementalPct;
  if (key === "cumulativeVolume") return row.cumulativeVolume ?? 0;
  if (key === "incrementalVolume") return row.incrementalVolume ?? 0;
  if (key.startsWith("scenario:")) return row.scenario[key.slice("scenario:".length)] ?? 0;
  return 0;
}

function nextDirection(current: TableSortState, key: string): "asc" | "desc" {
  if (current.key !== key) {
    return "asc";
  }
  return current.dir === "asc" ? "desc" : "asc";
}

function maybeMilestone(period: number, milestones: Milestones): { label: string; color: string } | null {
  if (milestones.reach10 === period) return { label: "10%", color: "rgb(var(--app-accent))" };
  if (milestones.reach50 === period) return { label: "50%", color: "rgb(var(--app-amber))" };
  if (milestones.reach90 === period) return { label: "90%", color: "rgb(var(--app-muted))" };
  return null;
}

export function TablePanel({ model, points, scenarios, milestones, tam, timeUnit, sort, onSort, onCopyChart }: TablePanelProps) {
  const rows: Row[] = points.map((point, index) => ({
    period: point.period,
    cumulativePct: point.cumulativePct,
    incrementalPct: point.incrementalPct,
    cumulativeVolume: point.cumulativeVolume,
    incrementalVolume: point.incrementalVolume,
    scenario: Object.fromEntries(scenarios.map((scenario) => [scenario.id, scenario.points[index].cumulativePct]))
  }));

  const displayRows = sortRows(rows, sort);
  const volumeVisible = tam != null;
  const peakPeriod = points.reduce((best, p, idx) => (p.incrementalPct > points[best].incrementalPct ? idx : best), 0) + 1;

  const headers = [
    "Period",
    "Cumulative %",
    "Incremental %",
    ...(volumeVisible ? ["Cumulative Volume", "Incremental Volume"] : []),
    ...scenarios.map((_, idx) => `S${idx + 1} Cumul%`)
  ];

  const exportRows = rows
    .slice()
    .sort((a, b) => a.period - b.period)
    .map((row) => [
      row.period,
      row.cumulativePct.toFixed(2),
      row.incrementalPct.toFixed(2),
      ...(volumeVisible
        ? [row.cumulativeVolume?.toFixed(2) ?? "", row.incrementalVolume?.toFixed(2) ?? ""]
        : []),
      ...scenarios.map((scenario) => (row.scenario[scenario.id] ?? 0).toFixed(2))
    ]);

  const onExportCsv = () => {
    const csv = serializeRowsToCsv(headers, exportRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `launch-uptake-${MODEL_LABELS[model].toLowerCase().replace(/\s+/g, "-")}-${todayStamp()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const onCopyTable = async () => {
    const tsv = serializeRowsToTsv(headers, exportRows);
    await navigator.clipboard.writeText(tsv);
  };

  const finalPoint = points[points.length - 1];
  const periodPrefix = timeUnit === "months" ? "Month" : "Week";

  return (
    <div className="rounded-panel border border-app-border bg-app-surface p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-chrome text-[11px] uppercase tracking-[0.1em] text-app-muted">Table</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportCsv}
            className="rounded border border-app-border px-2 py-1 font-chrome text-[10px] uppercase tracking-[0.08em] text-app-text hover:border-app-accent hover:text-app-accent"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => {
              void onCopyTable();
            }}
            className="rounded border border-app-border px-2 py-1 font-chrome text-[10px] uppercase tracking-[0.08em] text-app-text hover:border-app-accent hover:text-app-accent"
          >
            Copy Table
          </button>
          <button
            type="button"
            onClick={onCopyChart}
            className="rounded border border-app-border px-2 py-1 font-chrome text-[10px] uppercase tracking-[0.08em] text-app-text hover:border-app-accent hover:text-app-accent"
          >
            Copy Chart
          </button>
        </div>
      </div>
      <div className="max-h-[430px] overflow-auto rounded-panel border border-app-border">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead className="sticky top-0 z-10 bg-app-elevated">
            <tr className="font-chrome uppercase tracking-[0.08em] text-app-muted">
              <HeaderCell
                label="Period"
                active={sort.key === "period"}
                dir={sort.dir}
                onClick={() => onSort({ key: "period", dir: nextDirection(sort, "period") })}
              />
              <HeaderCell
                label="Cumulative %"
                active={sort.key === "cumulativePct"}
                dir={sort.dir}
                onClick={() => onSort({ key: "cumulativePct", dir: nextDirection(sort, "cumulativePct") })}
              />
              <HeaderCell
                label="Incremental %"
                active={sort.key === "incrementalPct"}
                dir={sort.dir}
                onClick={() => onSort({ key: "incrementalPct", dir: nextDirection(sort, "incrementalPct") })}
              />
              {volumeVisible && (
                <>
                  <HeaderCell
                    label="Cumulative Volume"
                    active={sort.key === "cumulativeVolume"}
                    dir={sort.dir}
                    onClick={() => onSort({ key: "cumulativeVolume", dir: nextDirection(sort, "cumulativeVolume") })}
                  />
                  <HeaderCell
                    label="Incremental Volume"
                    active={sort.key === "incrementalVolume"}
                    dir={sort.dir}
                    onClick={() => onSort({ key: "incrementalVolume", dir: nextDirection(sort, "incrementalVolume") })}
                  />
                </>
              )}
              {scenarios.map((scenario, idx) => (
                <HeaderCell
                  key={scenario.id}
                  label={`S${idx + 1} Cumul%`}
                  active={sort.key === `scenario:${scenario.id}`}
                  dir={sort.dir}
                  onClick={() => onSort({ key: `scenario:${scenario.id}`, dir: nextDirection(sort, `scenario:${scenario.id}`) })}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => {
              const milestone = maybeMilestone(row.period, milestones);
              const peak = row.period === peakPeriod;
              return (
                <tr
                  key={row.period}
                  className={clsx(i % 2 === 0 ? "bg-app-surface" : "bg-app-bg/60", "h-8 border-b border-app-border/40")}
                  style={milestone ? { borderLeft: `3px solid ${milestone.color}` } : undefined}
                >
                  <td className="px-2 font-chrome text-xs text-app-text">
                    {periodPrefix} {row.period}
                    {peak && <span className="ml-1 text-app-amber">▲</span>}
                  </td>
                  <td className="px-2 font-mono text-app-text">{fmtPct(row.cumulativePct)}</td>
                  <td className="px-2 font-mono text-app-text">{fmtPct(row.incrementalPct)}</td>
                  {volumeVisible && (
                    <>
                      <td className="px-2 font-mono text-app-text">{fmtVolume(row.cumulativeVolume)}</td>
                      <td className="px-2 font-mono text-app-text">{fmtVolume(row.incrementalVolume)}</td>
                    </>
                  )}
                  {scenarios.map((scenario) => (
                    <td key={scenario.id} className="px-2 font-mono text-app-text">
                      {fmtPct(row.scenario[scenario.id] ?? 0)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-app-elevated">
            <tr className="border-t border-app-border font-chrome text-xs uppercase tracking-[0.08em] text-app-muted">
              <td className="px-2 py-2">Final {periodPrefix} {finalPoint.period}</td>
              <td className="px-2 py-2">{fmtPct(finalPoint.cumulativePct)}</td>
              <td className="px-2 py-2">Ceiling {fmtPct(milestones.ceilingPct)}</td>
              {volumeVisible && (
                <>
                  <td className="px-2 py-2">{fmtVolume(finalPoint.cumulativeVolume)}</td>
                  <td className="px-2 py-2">Total Volume</td>
                </>
              )}
              {scenarios.map((scenario) => (
                <td key={scenario.id} className="px-2 py-2">
                  {fmtPct(scenario.points[scenario.points.length - 1].cumulativePct)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

interface HeaderCellProps {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}

function HeaderCell({ label, active, dir, onClick }: HeaderCellProps) {
  return (
    <th className="px-2 py-2">
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          "inline-flex items-center gap-1",
          active ? "text-app-accent" : "text-app-muted hover:text-app-text"
        )}
      >
        {label}
        {active && <span>{dir === "asc" ? "up" : "down"}</span>}
      </button>
    </th>
  );
}
