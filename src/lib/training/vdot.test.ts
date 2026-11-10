import { describe, expect, it } from "vitest";
import { estimateRunThresholdFromRace } from "./vdot";

const HALF_MARATHON_M = 21097.5;
const MARATHON_M = 42195;

describe("vdot.ts — estimateRunThresholdFromRace", () => {
  it("estimates VDOT ≈45.7 and T ≈275 s/km from HM 1:39:00", () => {
    // PLAN.md §3.1 / §9 M3: HM 1:39:00 between VDOT 45 (1:40:20) and 46 (1:38:27)
    const res = estimateRunThresholdFromRace(HALF_MARATHON_M, 5940);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.vdot).toBeCloseTo(45.7, 1);
    expect(res.value.thresholdPaceSecPerKm).toBeGreaterThanOrEqual(272);
    expect(res.value.thresholdPaceSecPerKm).toBeLessThanOrEqual(278);
    expect(res.value.estimated).toBe(true);
  });

  it("estimates VDOT ≈40 and T ≈306 s/km from M 3:49:00", () => {
    // PLAN.md §9 M3: M 3:49:00 ≈ VDOT 40 (table M 3:49:45), T 5:06/km
    const res = estimateRunThresholdFromRace(MARATHON_M, 13740);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.vdot).toBeCloseTo(40, 0);
    expect(res.value.thresholdPaceSecPerKm).toBeGreaterThanOrEqual(303);
    expect(res.value.thresholdPaceSecPerKm).toBeLessThanOrEqual(309);
    expect(res.value.estimated).toBe(true);
  });

  it("returns exact table-row values when race time matches a row", () => {
    // VDOT 45 HM 1:40:20 = 6020 s → T 4:38/km = 278 s/km
    const res = estimateRunThresholdFromRace(HALF_MARATHON_M, 6020);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.vdot).toBe(45);
    expect(res.value.thresholdPaceSecPerKm).toBe(278);
    expect(res.value.estimated).toBe(true);
  });

  it("rejects unsupported distances and out-of-table times", () => {
    expect(estimateRunThresholdFromRace(5000, 1200)).toEqual({
      ok: false,
      error: "unsupported-distance",
    });
    // Faster than best table HM (VDOT 85 HM 57:50 = 3470 s)
    expect(estimateRunThresholdFromRace(HALF_MARATHON_M, 3000)).toEqual({
      ok: false,
      error: "out-of-table",
    });
    // Slower than slowest table HM (VDOT 30 HM 2:21:04 = 8464 s)
    expect(estimateRunThresholdFromRace(HALF_MARATHON_M, 9000)).toEqual({
      ok: false,
      error: "out-of-table",
    });
    expect(estimateRunThresholdFromRace(HALF_MARATHON_M, 0)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
    expect(estimateRunThresholdFromRace(0, 5940)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
  });
});
