import { describe, expect, it } from "vitest";
import {
  computePaceSecPer100m,
  computePaceSecPerKm,
  computeSpeedKph,
  formatDurationHms,
  formatPaceMinPerKm,
  formatPaceMmSs,
  formatPacePer100m,
  paceSecPerKmToSpeedKph,
  parseDurationHms,
  speedKphToPaceSecPerKm,
} from "./time";

describe("time.ts — duration parse & format (h:mm:ss)", () => {
  it("parses 0:00:00 and 0:00 to 0 seconds", () => {
    expect(parseDurationHms("0:00:00")).toEqual({ ok: true, value: 0 });
    expect(parseDurationHms("0:00")).toEqual({ ok: true, value: 0 });
  });

  it("parses PLAN.md §3 & §4.2 race and split durations", () => {
    expect(parseDurationHms("0:50:00")).toEqual({ ok: true, value: 3000 });
    expect(parseDurationHms("50:00")).toEqual({ ok: true, value: 3000 });
    expect(parseDurationHms("0:07:00")).toEqual({ ok: true, value: 420 });
    expect(parseDurationHms("3:00:00")).toEqual({ ok: true, value: 10800 });
    expect(parseDurationHms("0:04:00")).toEqual({ ok: true, value: 240 });
    expect(parseDurationHms("1:55:00")).toEqual({ ok: true, value: 6900 });
    expect(parseDurationHms("5:56:00")).toEqual({ ok: true, value: 21360 });
    expect(parseDurationHms("1:39:00")).toEqual({ ok: true, value: 5940 });
    expect(parseDurationHms("3:49:00")).toEqual({ ok: true, value: 13740 });
    expect(parseDurationHms("8:30:00")).toEqual({ ok: true, value: 30600 });
    expect(parseDurationHms("12:05:09")).toEqual({ ok: true, value: 43509 });
  });

  it("rejects malformed or out-of-range duration strings", () => {
    expect(parseDurationHms("")).toEqual({ ok: false, error: "invalid-format" });
    expect(parseDurationHms("   ")).toEqual({ ok: false, error: "invalid-format" });
    expect(parseDurationHms("abc")).toEqual({ ok: false, error: "invalid-format" });
    expect(parseDurationHms("1:60:00")).toEqual({ ok: false, error: "invalid-format" });
    expect(parseDurationHms("1:02:60")).toEqual({ ok: false, error: "invalid-format" });
    expect(parseDurationHms("0:5")).toEqual({ ok: false, error: "invalid-format" });
    expect(parseDurationHms("1:2:03")).toEqual({ ok: false, error: "invalid-format" });
    expect(parseDurationHms("-1:00:00")).toEqual({ ok: false, error: "invalid-format" });
    expect(parseDurationHms("1:00:00:00")).toEqual({ ok: false, error: "invalid-format" });
  });

  it("formats 0 and multi-hour integer seconds into h:mm:ss", () => {
    expect(formatDurationHms(0)).toBe("0:00:00");
    expect(formatDurationHms(420)).toBe("0:07:00");
    expect(formatDurationHms(3000)).toBe("0:50:00");
    expect(formatDurationHms(3600)).toBe("1:00:00");
    expect(formatDurationHms(5940)).toBe("1:39:00");
    expect(formatDurationHms(6900)).toBe("1:55:00");
    expect(formatDurationHms(10800)).toBe("3:00:00");
    expect(formatDurationHms(21360)).toBe("5:56:00");
    expect(formatDurationHms(30600)).toBe("8:30:00");
    expect(formatDurationHms(43509)).toBe("12:05:09");
  });

  it("rounds fractional seconds cleanly without producing :60", () => {
    expect(formatDurationHms(275.4)).toBe("0:04:35");
    expect(formatDurationHms(275.6)).toBe("0:04:36");
    expect(formatDurationHms(59.6)).toBe("0:01:00");
    expect(formatDurationHms(3599.6)).toBe("1:00:00");
  });
});

describe("time.ts — run pace (sec/km and min/km)", () => {
  it("computes paceSecPerKm from distanceM and durationSec", () => {
    // 21.1 km in 1:55:00 (6900 s) -> ~327.014 s/km
    const res = computePaceSecPerKm(21100, 6900);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toBeCloseTo(327.014, 2);
      expect(formatPaceMinPerKm(res.value)).toBe("5:27/km");
    }

    // 10 km in 45:50 (2750 s) -> 275 s/km (4:35/km)
    expect(computePaceSecPerKm(10000, 2750)).toEqual({ ok: true, value: 275 });
    expect(computePaceSecPerKm(1000, 0)).toEqual({ ok: true, value: 0 });
  });

  it("rejects non-positive distance or negative duration for computePaceSecPerKm", () => {
    expect(computePaceSecPerKm(0, 300)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
    expect(computePaceSecPerKm(-1000, 300)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
    expect(computePaceSecPerKm(1000, -10)).toEqual({
      ok: false,
      error: "negative-value",
    });
  });

  it("formats pace in m:ss and m:ss/km with proper rounding and >1 h support", () => {
    expect(formatPaceMmSs(0)).toBe("0:00");
    expect(formatPaceMmSs(275)).toBe("4:35");
    expect(formatPaceMinPerKm(275)).toBe("4:35/km");
    expect(formatPaceMinPerKm(327.014)).toBe("5:27/km");
    // Rollover edge case: 299.6 s -> 300 s -> 5:00/km (never 4:60/km)
    expect(formatPaceMinPerKm(299.6)).toBe("5:00/km");
    // >= 1 hour pace
    expect(formatPaceMmSs(3600)).toBe("1:00:00");
    expect(formatPaceMinPerKm(3661)).toBe("1:01:01/km");
  });
});

describe("time.ts — swim pace (sec/100m)", () => {
  it("computes paceSecPer100m from distanceM and durationSec", () => {
    // PLAN.md §4.2: 1900 m in 50:00 (3000 s) -> 157.8947 s/100m (~2:38/100m)
    const swimSplit = computePaceSecPer100m(1900, 3000);
    expect(swimSplit.ok).toBe(true);
    if (swimSplit.ok) {
      expect(swimSplit.value).toBeCloseTo(157.895, 2);
      expect(formatPacePer100m(swimSplit.value)).toBe("2:38/100m");
    }

    // 400 m in 6:00 (360 s) -> 90 s/100m (1:30/100m)
    expect(computePaceSecPer100m(400, 360)).toEqual({ ok: true, value: 90 });
    expect(formatPacePer100m(90)).toBe("1:30/100m");
    expect(computePaceSecPer100m(100, 0)).toEqual({ ok: true, value: 0 });
    expect(formatPacePer100m(0)).toBe("0:00/100m");
  });

  it("handles rounding rollover and invalid inputs for swim pace", () => {
    expect(formatPacePer100m(119.6)).toBe("2:00/100m");
    expect(computePaceSecPer100m(0, 100)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
    expect(computePaceSecPer100m(-400, 360)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
    expect(computePaceSecPer100m(400, -1)).toEqual({
      ok: false,
      error: "negative-value",
    });
  });
});

describe("time.ts — pace ↔ speed conversions", () => {
  it("converts between paceSecPerKm and speedKph", () => {
    // 30.0 km/h <-> 120 s/km (2:00/km)
    expect(speedKphToPaceSecPerKm(30)).toEqual({ ok: true, value: 120 });
    expect(paceSecPerKmToSpeedKph(120)).toEqual({ ok: true, value: 30 });

    // 4:35/km (275 s/km) -> ~13.0909 km/h -> round-trip back to 275 s/km
    const speedRes = paceSecPerKmToSpeedKph(275);
    expect(speedRes.ok).toBe(true);
    if (speedRes.ok) {
      expect(speedRes.value).toBeCloseTo(13.0909, 3);
      const paceBack = speedKphToPaceSecPerKm(speedRes.value);
      expect(paceBack.ok).toBe(true);
      if (paceBack.ok) {
        expect(paceBack.value).toBeCloseTo(275, 6);
      }
    }
  });

  it("computes speedKph for PLAN.md §4.2 and §4.3 bike examples", () => {
    // 90 km (90,000 m) in 3:00:00 (10,800 s) -> 30.0 km/h
    expect(computeSpeedKph(90000, 10800)).toEqual({ ok: true, value: 30 });

    // PLAN.md §4.3: min bike speed for 5:30 (19,800 s) cut-off after 57-min (3,420 s) swim+T1
    // Remaining bike time = 16,380 s -> 90,000 m / 16,380 s = 19.7802 km/h (~19.8 km/h)
    const minBike = computeSpeedKph(90000, 16380);
    expect(minBike.ok).toBe(true);
    if (minBike.ok) {
      expect(minBike.value).toBeCloseTo(19.78, 2);
    }

    // Zero distance in positive time -> 0 km/h
    expect(computeSpeedKph(0, 100)).toEqual({ ok: true, value: 0 });
  });

  it("rejects non-positive inputs for pace/speed conversions", () => {
    expect(paceSecPerKmToSpeedKph(0)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
    expect(paceSecPerKmToSpeedKph(-200)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
    expect(speedKphToPaceSecPerKm(0)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
    expect(speedKphToPaceSecPerKm(-25)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
    expect(computeSpeedKph(90000, 0)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
    expect(computeSpeedKph(90000, -100)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
    expect(computeSpeedKph(-100, 60)).toEqual({
      ok: false,
      error: "negative-value",
    });
  });
});
