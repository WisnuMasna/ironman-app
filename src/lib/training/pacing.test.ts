import { describe, expect, it } from "vitest";
import {
  computeLegMetrics,
  computeMinBikeSpeedKph,
  getDefaultSub600Splits,
  validateSplitsAgainstCutoffs,
} from "./pacing";

describe("pacing.ts — default sub-6:00 splits (PLAN.md §4.2)", () => {
  it("returns the stretch-goal default splits totalling 5:56:00", () => {
    const splits = getDefaultSub600Splits();
    expect(splits).toEqual({
      swimSec: 3000,
      t1Sec: 420,
      bikeSec: 10800,
      t2Sec: 240,
      runSec: 6900,
    });
    expect(
      splits.swimSec +
        splits.t1Sec +
        splits.bikeSec +
        splits.t2Sec +
        splits.runSec
    ).toBe(21360);
  });

  it("computes bike 30.0 km/h and run ≈5:27/km from default splits", () => {
    const splits = getDefaultSub600Splits();
    const metrics = computeLegMetrics(splits);
    expect(metrics.ok).toBe(true);
    if (!metrics.ok) return;
    expect(metrics.value.bikeSpeedKph).toBeCloseTo(30.0, 1);
    expect(metrics.value.runPaceSecPerKm).toBeCloseTo(327.01, 1);
    expect(metrics.value.swimPaceSecPer100m).toBeCloseTo(157.89, 1);
    expect(metrics.value.totalSec).toBe(21360);
  });
});

describe("pacing.ts — cut-offs and min bike speed", () => {
  it("accepts default splits against Da Nang cut-offs", () => {
    const splits = getDefaultSub600Splits();
    expect(validateSplitsAgainstCutoffs(splits)).toEqual({ ok: true, value: splits });
  });

  it("rejects a split that breaks the swim cut-off", () => {
    const splits = { ...getDefaultSub600Splits(), swimSec: 4201 };
    expect(validateSplitsAgainstCutoffs(splits)).toEqual({
      ok: false,
      error: "cutoff-swim",
    });
  });

  it("rejects a split that breaks the swim+T1+bike cut-off", () => {
    const splits = {
      ...getDefaultSub600Splits(),
      swimSec: 4000,
      t1Sec: 600,
      bikeSec: 16000, // 4000+600+16000 = 20600 > 19800
    };
    expect(validateSplitsAgainstCutoffs(splits)).toEqual({
      ok: false,
      error: "cutoff-swim-t1-bike",
    });
  });

  it("rejects a split that breaks the total cut-off", () => {
    const splits = {
      ...getDefaultSub600Splits(),
      runSec: 20000, // pushes total over 8:30
    };
    expect(validateSplitsAgainstCutoffs(splits)).toEqual({
      ok: false,
      error: "cutoff-total",
    });
  });

  it("computes min bike speed ≈19.8 km/h after 57-min swim+T1", () => {
    // PLAN.md §4.3 / §9 M4: 5:30 cut-off (19800) − 57 min (3420) = 16380 s for 90 km
    const res = computeMinBikeSpeedKph({
      swimPlusT1Sec: 3420,
      swimT1BikeCutoffSec: 19800,
      bikeDistanceM: 90000,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value).toBeCloseTo(19.78, 2);
  });

  it("rejects impossible remaining bike time for min speed", () => {
    expect(
      computeMinBikeSpeedKph({
        swimPlusT1Sec: 19800,
        swimT1BikeCutoffSec: 19800,
        bikeDistanceM: 90000,
      })
    ).toEqual({ ok: false, error: "no-bike-time-remaining" });
  });
});
