import { useState } from "react";
import type { PiecewiseKnot } from "../../types";
import { SectionLabel } from "../../../components/ui/SectionLabel";

interface PiecewiseControlsProps {
  knots: PiecewiseKnot[];
  onChange: (knots: PiecewiseKnot[]) => void;
}

export function PiecewiseControls({ knots, onChange }: PiecewiseControlsProps) {
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const updateKnot = (idx: number, field: "month" | "survival", value: number) => {
    const next = knots.map((k, i) => (i === idx ? { ...k, [field]: value } : k));
    next.sort((a, b) => a.month - b.month);
    onChange(next);
  };

  const addKnot = () => {
    const lastMonth = knots.length > 0 ? knots[knots.length - 1].month : 0;
    const lastSurv = knots.length > 0 ? knots[knots.length - 1].survival : 100;
    const newKnot: PiecewiseKnot = {
      month: lastMonth + 3,
      survival: Math.max(0, lastSurv - 10)
    };
    onChange([...knots, newKnot].sort((a, b) => a.month - b.month));
  };

  const removeKnot = (idx: number) => {
    if (knots.length <= 2) return;
    onChange(knots.filter((_, i) => i !== idx));
    setEditIdx(null);
  };

  return (
    <div>
      <SectionLabel>Piecewise Knots</SectionLabel>
      <div className="rounded border border-app-border bg-app-surface overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-app-border bg-app-elevated">
              <th className="px-2 py-1.5 text-left font-chrome text-[10px] uppercase tracking-wider text-app-muted">Month</th>
              <th className="px-2 py-1.5 text-left font-chrome text-[10px] uppercase tracking-wider text-app-muted">S(t) %</th>
              <th className="px-2 py-1.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {knots.map((knot, idx) => (
              <tr key={idx} className="border-b border-app-border/50 last:border-0">
                <td className="px-2 py-1">
                  {editIdx === idx ? (
                    <input
                      type="number"
                      className="h-6 w-16 rounded border border-app-border bg-app-bg px-1 text-xs text-app-text outline-none focus:border-app-accent"
                      value={knot.month}
                      min={0}
                      onChange={(e) => updateKnot(idx, "month", Number(e.target.value))}
                      onBlur={() => setEditIdx(null)}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="cursor-pointer text-app-text hover:text-app-accent"
                      onClick={() => setEditIdx(idx)}
                    >
                      {knot.month}
                    </span>
                  )}
                </td>
                <td className="px-2 py-1">
                  {editIdx === idx ? (
                    <input
                      type="number"
                      className="h-6 w-16 rounded border border-app-border bg-app-bg px-1 text-xs text-app-text outline-none focus:border-app-accent"
                      value={knot.survival}
                      min={0}
                      max={100}
                      onChange={(e) => updateKnot(idx, "survival", Number(e.target.value))}
                      onBlur={() => setEditIdx(null)}
                    />
                  ) : (
                    <span
                      className="cursor-pointer text-app-text hover:text-app-accent"
                      onClick={() => setEditIdx(idx)}
                    >
                      {knot.survival.toFixed(1)}%
                    </span>
                  )}
                </td>
                <td className="px-2 py-1 text-center">
                  {knots.length > 2 && (
                    <button
                      onClick={() => removeKnot(idx)}
                      className="text-app-muted hover:text-red-400 text-[11px]"
                      title="Remove knot"
                    >
                      x
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={addKnot}
        className="mt-2 rounded border border-app-border px-3 py-1 font-chrome text-[11px] uppercase tracking-wider text-app-muted hover:border-app-accent hover:text-app-accent"
      >
        + Add Knot
      </button>
    </div>
  );
}
