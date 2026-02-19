import { describe, expect, it } from "vitest";
import { deriveMilestones } from "../lib/milestones";

describe("milestones", () => {
  it("finds thresholds and peak growth", () => {
    const cumulative = [2, 8, 12, 25, 52, 75, 91, 96];
    const incremental = [2, 6, 4, 13, 27, 23, 16, 5];
    const m = deriveMilestones(cumulative, incremental, 100);
    expect(m.reach10).toBe(3);
    expect(m.reach50).toBe(5);
    expect(m.reach90).toBe(7);
    expect(m.peakAt).toBe(5);
  });

  it("returns null for unreached milestone", () => {
    const m = deriveMilestones([1, 2, 3], [1, 1, 1], 100);
    expect(m.reach90).toBeNull();
  });
});
