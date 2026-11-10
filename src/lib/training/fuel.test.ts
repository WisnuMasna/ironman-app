import { describe, expect, it } from "vitest";
import { planFuelAndFluid } from "./fuel";

describe("fuel.ts — planFuelAndFluid", () => {
  it("builds per-hour and per-aid-station carbs/fluid/sodium for a 3 h bike leg", () => {
    const res = planFuelAndFluid({
      bodyMassKg: 70,
      sweatRateLPerH: 0.8,
      fluidIntakeLPerH: 0.6,
      carbGPerH: 60,
      legDistanceKm: 90,
      legDurationSec: 10800, // 3:00
      aidStationsKm: [19, 37, 46, 64, 79.5],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.perHour.carbG).toBe(60);
    expect(res.value.perHour.fluidL).toBe(0.6);
    expect(res.value.perHour.sodiumMg).toBeGreaterThan(0);
    expect(res.value.aidStations).toHaveLength(5);
    expect(res.value.aidStations[0]?.km).toBe(19);
    expect(res.value.aidStations[0]?.carbG).toBeGreaterThan(0);
    expect(res.value.aidStations[0]?.fluidL).toBeGreaterThan(0);
    expect(res.value.warnings).toEqual([]);
    // 3 h effort → ACSM allows up to 90 g/h
    expect(res.value.carbGuidanceGPerH).toEqual({ min: 30, max: 90 });
  });

  it("warns on overdrinking when intake exceeds sweat rate", () => {
    const res = planFuelAndFluid({
      bodyMassKg: 70,
      sweatRateLPerH: 0.5,
      fluidIntakeLPerH: 0.9, // > sweat
      carbGPerH: 40,
      legDistanceKm: 21.1,
      legDurationSec: 6900,
      aidStationsKm: [5, 10, 15, 20],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.warnings).toContain("overdrinking");
  });

  it("warns when planned intake allows >2% body-mass loss", () => {
    // 70 kg athlete, sweat 1.5 L/h for 3 h = 4.5 L sweat, drink 0.2 L/h = 0.6 L
    // net loss 3.9 L ≈ 5.6% > 2%
    const res = planFuelAndFluid({
      bodyMassKg: 70,
      sweatRateLPerH: 1.5,
      fluidIntakeLPerH: 0.2,
      carbGPerH: 60,
      legDistanceKm: 90,
      legDurationSec: 10800,
      aidStationsKm: [19, 37, 46, 64, 79.5],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.massLossPct).toBeGreaterThan(2);
    expect(res.value.warnings).toContain("mass-loss-over-2pct");
  });

  it("returns test-needed when body mass or sweat rate is null", () => {
    expect(
      planFuelAndFluid({
        bodyMassKg: null,
        sweatRateLPerH: 0.8,
        fluidIntakeLPerH: 0.6,
        carbGPerH: 60,
        legDistanceKm: 90,
        legDurationSec: 10800,
        aidStationsKm: [19],
      })
    ).toEqual({ ok: false, error: "test-needed" });

    expect(
      planFuelAndFluid({
        bodyMassKg: 70,
        sweatRateLPerH: null,
        fluidIntakeLPerH: 0.6,
        carbGPerH: 60,
        legDistanceKm: 90,
        legDurationSec: 10800,
        aidStationsKm: [19],
      })
    ).toEqual({ ok: false, error: "test-needed" });
  });

  it("rejects non-positive duration, distance, or intake rates", () => {
    expect(
      planFuelAndFluid({
        bodyMassKg: 70,
        sweatRateLPerH: 0.8,
        fluidIntakeLPerH: 0.6,
        carbGPerH: 60,
        legDistanceKm: 90,
        legDurationSec: 0,
        aidStationsKm: [19],
      })
    ).toEqual({ ok: false, error: "non-positive-input" });
  });

  it("recommends 30–60 g/h carbs for efforts under 2.5 h", () => {
    const res = planFuelAndFluid({
      bodyMassKg: 70,
      sweatRateLPerH: 0.7,
      fluidIntakeLPerH: 0.5,
      carbGPerH: 45,
      legDistanceKm: 21.1,
      legDurationSec: 6900, // 1:55 < 2.5 h
      aidStationsKm: [5, 10, 15],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.carbGuidanceGPerH).toEqual({ min: 30, max: 60 });
  });
});
