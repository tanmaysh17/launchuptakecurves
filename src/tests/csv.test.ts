import { describe, expect, it } from "vitest";
import { parseObservedCsv, serializeRowsToCsv, serializeRowsToTsv } from "../lib/csv";

describe("csv parser", () => {
  it("parses and sorts rows with header", () => {
    const parsed = parseObservedCsv("period,adoption%\n2,1.1\n1,0.2\n2,1.3");
    expect(parsed.error).toBeNull();
    expect(parsed.data).toEqual([
      { period: 1, adoptionPct: 0.2 },
      { period: 2, adoptionPct: 1.3 }
    ]);
  });

  it("rejects invalid period", () => {
    const parsed = parseObservedCsv("a,b\n0,10");
    expect(parsed.error).toMatch(/period/);
  });

  it("serializes csv and tsv", () => {
    const csv = serializeRowsToCsv(["A", "B"], [[1, "x"], [2, "y"]]);
    const tsv = serializeRowsToTsv(["A", "B"], [[1, "x"], [2, "y"]]);
    expect(csv).toContain("A,B");
    expect(tsv).toContain("A\tB");
  });
});
