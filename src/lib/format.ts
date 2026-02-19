export function fmtPct(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function fmtVolume(value: number | null): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });
}

export function fmtPeriod(period: number | null, unit: "months" | "weeks"): string {
  if (period == null) {
    return "--";
  }
  const prefix = unit === "months" ? "Month" : "Week";
  return `${prefix} ${period}`;
}

export function todayStamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
