import { useEffect, useMemo, useState } from "react";
import type { Milestones, TimeUnit } from "../types";
import { fmtPct } from "../lib/format";

interface MilestonesPanelProps {
  milestones: Milestones;
  timeUnit: TimeUnit;
  scenarioMilestones?: Array<{ id: string; name: string; color: string; milestones: Milestones }>;
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

export function MilestonesPanel({ milestones, timeUnit, scenarioMilestones = [] }: MilestonesPanelProps) {
  const cards = useMemo<CardData[]>(
    () => [
      { label: "Reach 10%", value: milestones.reach10, color: "rgb(var(--app-accent))", kind: "period" },
      { label: "Reach 50%", value: milestones.reach50, color: "rgb(var(--app-amber))", kind: "period" },
      { label: "Reach 90%", value: milestones.reach90, color: "rgb(var(--app-muted))", kind: "period" },
      { label: "Peak Growth", value: milestones.peakGrowthPct, color: "rgb(var(--app-accent))", suffix: "/period", kind: "value" },
      { label: "Peak Growth At", value: milestones.peakGrowthAt, color: "rgb(var(--app-purple))", kind: "period" },
      { label: "Time to Peak (99%)", value: milestones.peakAt, color: "rgb(var(--app-amber))", kind: "period" },
      { label: "Ceiling", value: milestones.ceilingPct, color: "rgb(var(--app-muted))", kind: "value" }
    ],
    [milestones]
  );

  return (
    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
      {cards.map((card) => (
        <MilestoneCard key={card.label} card={card} timeUnit={timeUnit} scenarioMilestones={scenarioMilestones} />
      ))}
    </div>
  );
}

interface MilestoneCardProps {
  card: CardData;
  timeUnit: TimeUnit;
  scenarioMilestones: Array<{ id: string; name: string; color: string; milestones: Milestones }>;
}

function scenarioValue(card: CardData, milestones: Milestones): string {
  if (card.label === "Reach 10%") return milestones.reach10 == null ? "--" : String(milestones.reach10);
  if (card.label === "Reach 50%") return milestones.reach50 == null ? "--" : String(milestones.reach50);
  if (card.label === "Reach 90%") return milestones.reach90 == null ? "--" : String(milestones.reach90);
  if (card.label === "Peak Growth") return fmtPct(milestones.peakGrowthPct);
  if (card.label === "Peak Growth At") return String(milestones.peakGrowthAt);
  if (card.label === "Time to Peak (99%)") return milestones.peakAt == null ? "--" : String(milestones.peakAt);
  return fmtPct(milestones.ceilingPct);
}

function MilestoneCard({ card, timeUnit, scenarioMilestones }: MilestoneCardProps) {
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
      {scenarioMilestones.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {scenarioMilestones.map((scenario) => (
            <span
              key={`${card.label}-${scenario.id}`}
              className="rounded border px-1.5 py-0.5 font-chrome text-[10px] text-app-text"
              style={{ borderColor: scenario.color }}
            >
              {scenario.name}: {scenarioValue(card, scenario.milestones)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
