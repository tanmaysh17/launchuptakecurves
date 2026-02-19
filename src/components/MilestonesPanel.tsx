import { useEffect, useMemo, useState } from "react";
import type { Milestones, TimeUnit } from "../types";
import { fmtPct } from "../lib/format";

interface MilestonesPanelProps {
  milestones: Milestones;
  timeUnit: TimeUnit;
}

interface CardData {
  label: string;
  value: number | null;
  suffix?: string;
  color: string;
  kind: "period" | "value";
}

function useAnimatedNumber(target: number, duration = 280): number {
  const [value, setValue] = useState(target);

  useEffect(() => {
    const start = performance.now();
    const initial = value;
    const delta = target - initial;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(initial + delta * t);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  return value;
}

function periodLabel(period: number | null, unit: TimeUnit): string {
  if (period == null) return "--";
  return `${unit === "months" ? "M" : "W"}${period}`;
}

export function MilestonesPanel({ milestones, timeUnit }: MilestonesPanelProps) {
  const cards = useMemo<CardData[]>(
    () => [
      { label: "Reach 10%", value: milestones.reach10, color: "#00d4b4", kind: "period" },
      { label: "Reach 50%", value: milestones.reach50, color: "#f0a500", kind: "period" },
      { label: "Reach 90%", value: milestones.reach90, color: "#8b949e", kind: "period" },
      { label: "Peak Growth", value: milestones.peakGrowthPct, color: "#00d4b4", suffix: "/period", kind: "value" },
      { label: "Peak At", value: milestones.peakAt, color: "#f0a500", kind: "period" },
      { label: "Ceiling", value: milestones.ceilingPct, color: "#8b949e", kind: "value" }
    ],
    [milestones]
  );

  return (
    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
      {cards.map((card) => (
        <MilestoneCard key={card.label} card={card} timeUnit={timeUnit} />
      ))}
    </div>
  );
}

interface MilestoneCardProps {
  card: CardData;
  timeUnit: TimeUnit;
}

function MilestoneCard({ card, timeUnit }: MilestoneCardProps) {
  const animated = useAnimatedNumber(card.value ?? 0);
  const text =
    card.value == null
      ? "--"
      : card.kind === "period"
        ? periodLabel(Math.round(animated), timeUnit)
        : `${fmtPct(animated)}${card.suffix ? ` ${card.suffix}` : ""}`;

  return (
    <div className="rounded-panel border border-app-border bg-app-surface px-3 py-3">
      <div className="font-chrome text-[10px] uppercase tracking-[0.1em] text-app-muted">{card.label}</div>
      <div className="mt-1 text-[30px] font-semibold leading-none" style={{ color: card.color }}>
        {text}
      </div>
    </div>
  );
}
