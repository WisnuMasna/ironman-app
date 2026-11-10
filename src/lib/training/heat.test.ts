import { describe, expect, it } from "vitest";
import { adjustRunPaceForHeat } from "./heat";

describe("heat.ts — adjustRunPaceForHeat", () => {
  it("applies 0% slowdown at 10 °C WBGT (cool reference)", () => {
    const res = adjustRunPaceForHeat(327, 10);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.adjustedPaceSecPerKm).toBe(327);
    expect(res.value.slowdownPct).toBe(0);
    expect(res.value.warning).toBeNull();
  });

  it("applies +3.2% slowdown at 15 °C WBGT", () => {
    // PLAN.md §8 / §9 M5: 3.2% per 5 °C above the 5–10 °C band
    const res = adjustRunPaceForHeat(327, 15);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.slowdownPct).toBeCloseTo(3.2, 5);
    expect(res.value.adjustedPaceSecPerKm).toBeCloseTo(327 * 1.032, 5);
    expect(res.value.warning).toBeNull();
  });

  it("flags extrapolated warning above 25 °C WBGT", () => {
    const res = adjustRunPaceForHeat(327, 28);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // 28 − 10 = 18 °C above reference → 18/5 * 3.2 = 11.52%
    expect(res.value.slowdownPct).toBeCloseTo(11.52, 5);
    expect(res.value.warning).toBe("extrapolated");
  });

  it("treats WBGT at or below 10 °C as 0% slowdown", () => {
    const res = adjustRunPaceForHeat(300, 5);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.adjustedPaceSecPerKm).toBe(300);
    expect(res.value.slowdownPct).toBe(0);
  });

  it("rejects non-positive pace", () => {
    expect(adjustRunPaceForHeat(0, 15)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
    expect(adjustRunPaceForHeat(-10, 15)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
  });
});
