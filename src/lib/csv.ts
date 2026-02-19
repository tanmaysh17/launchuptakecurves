import type { ObservedPoint } from "../types";

export interface ParsedCsv {
  data: ObservedPoint[];
  error: string | null;
}

export function parseObservedCsv(text: string): ParsedCsv {
  const rawLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!rawLines.length) {
    return { data: [], error: null };
  }

  const lines = maybeDropHeader(rawLines);
  const dedupe = new Map<number, number>();

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const cells = line.split(/[,\t;]/).map((cell) => cell.trim());
    if (cells.length < 2) {
      return { data: [], error: `Line ${i + 1} must have two columns: period, adoption%.` };
    }
    const period = Number(cells[0]);
    const adoptionPct = Number(cells[1]);
    if (!Number.isFinite(period) || !Number.isInteger(period) || period < 1) {
      return { data: [], error: `Line ${i + 1}: period must be an integer >= 1.` };
    }
    if (!Number.isFinite(adoptionPct) || adoptionPct < 0 || adoptionPct > 100) {
      return { data: [], error: `Line ${i + 1}: adoption% must be between 0 and 100.` };
    }
    dedupe.set(period, adoptionPct);
  }

  const data = Array.from(dedupe.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([period, adoptionPct]) => ({ period, adoptionPct }));

  return { data, error: null };
}

function maybeDropHeader(lines: string[]): string[] {
  if (!lines.length) {
    return lines;
  }
  const first = lines[0].toLowerCase();
  const hasLetters = /[a-z]/.test(first);
  return hasLetters ? lines.slice(1) : lines;
}

export function serializeRowsToCsv(headers: string[], rows: (string | number)[][]): string {
  const out: string[] = [];
  out.push(headers.join(","));
  for (const row of rows) {
    out.push(
      row
        .map((cell) => {
          const s = String(cell);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, "\"\"")}"` : s;
        })
        .join(",")
    );
  }
  return out.join("\n");
}

export function serializeRowsToTsv(headers: string[], rows: (string | number)[][]): string {
  const out: string[] = [];
  out.push(headers.join("\t"));
  for (const row of rows) {
    out.push(row.map((cell) => String(cell)).join("\t"));
  }
  return out.join("\n");
}
