import {
  CARB_G_PER_H_LONG_MAX,
  CARB_G_PER_H_LONG_MIN,
  CARB_G_PER_H_MODERATE_MAX,
  CARB_G_PER_H_MODERATE_MIN,
  CARB_LONG_DURATION_SEC,
  MAX_BODY_MASS_LOSS_PCT,
  SECONDS_PER_HOUR,
  SWEAT_SODIUM_MG_PER_L,
} from "./constants";

export type FuelPlanInput = {
  bodyMassKg: number | null;
  sweatRateLPerH: number | null;
  fluidIntakeLPerH: number;
  carbGPerH: number;
  legDistanceKm: number;
  legDurationSec: number;
  aidStationsKm: number[];
};

export type AidStationPlan = {
  km: number;
  carbG: number;
  fluidL: number;
  sodiumMg: number;
};

export type FuelPlan = {
  perHour: { carbG: number; fluidL: number; sodiumMg: number };
  aidStations: AidStationPlan[];
  massLossPct: number;
  carbGuidanceGPerH: { min: number; max: number };
  warnings: Array<"overdrinking" | "mass-loss-over-2pct">;
};

export type FuelResult =
  | { ok: true; value: FuelPlan }
  | { ok: false; error: "test-needed" | "non-positive-input" };

/**
 * Builds a race/leg fuel & fluid plan with ACSM-based warnings.
 * Warns if planned drinking exceeds sweat rate (overdrinking) or net mass
 * loss would exceed 2%.
 */
export function planFuelAndFluid(input: FuelPlanInput): FuelResult {
  if (input.bodyMassKg === null || input.sweatRateLPerH === null) {
    return { ok: false, error: "test-needed" };
  }
  if (
    !Number.isFinite(input.bodyMassKg) ||
    !Number.isFinite(input.sweatRateLPerH) ||
    !Number.isFinite(input.fluidIntakeLPerH) ||
    !Number.isFinite(input.carbGPerH) ||
    !Number.isFinite(input.legDistanceKm) ||
    !Number.isFinite(input.legDurationSec) ||
    input.bodyMassKg <= 0 ||
    input.sweatRateLPerH <= 0 ||
    input.fluidIntakeLPerH < 0 ||
    input.carbGPerH < 0 ||
    input.legDistanceKm <= 0 ||
    input.legDurationSec <= 0
  ) {
    return { ok: false, error: "non-positive-input" };
  }

  const durationH = input.legDurationSec / SECONDS_PER_HOUR;
  const sweatLossL = input.sweatRateLPerH * durationH;
  const fluidIntakeL = input.fluidIntakeLPerH * durationH;
  const netLossL = sweatLossL - fluidIntakeL;
  const massLossPct = (netLossL / input.bodyMassKg) * 100;

  const warnings: FuelPlan["warnings"] = [];
  if (input.fluidIntakeLPerH > input.sweatRateLPerH) {
    warnings.push("overdrinking");
  }
  if (massLossPct > MAX_BODY_MASS_LOSS_PCT) {
    warnings.push("mass-loss-over-2pct");
  }

  const carbGuidanceGPerH =
    input.legDurationSec >= CARB_LONG_DURATION_SEC
      ? { min: CARB_G_PER_H_LONG_MIN, max: CARB_G_PER_H_LONG_MAX }
      : { min: CARB_G_PER_H_MODERATE_MIN, max: CARB_G_PER_H_MODERATE_MAX };

  const sodiumMgPerH =
    input.sweatRateLPerH * SWEAT_SODIUM_MG_PER_L;

  const aidStations = buildAidStationPlans({
    aidStationsKm: input.aidStationsKm,
    legDistanceKm: input.legDistanceKm,
    legDurationSec: input.legDurationSec,
    carbGPerH: input.carbGPerH,
    fluidIntakeLPerH: input.fluidIntakeLPerH,
    sodiumMgPerH,
  });

  return {
    ok: true,
    value: {
      perHour: {
        carbG: input.carbGPerH,
        fluidL: input.fluidIntakeLPerH,
        sodiumMg: sodiumMgPerH,
      },
      aidStations,
      massLossPct,
      carbGuidanceGPerH,
      warnings,
    },
  };
}

function buildAidStationPlans(input: {
  aidStationsKm: number[];
  legDistanceKm: number;
  legDurationSec: number;
  carbGPerH: number;
  fluidIntakeLPerH: number;
  sodiumMgPerH: number;
}): AidStationPlan[] {
  if (input.aidStationsKm.length === 0) return [];

  const speedKmPerH =
    input.legDistanceKm / (input.legDurationSec / SECONDS_PER_HOUR);
  let prevKm = 0;

  return input.aidStationsKm.map((km) => {
    const segmentKm = Math.max(0, km - prevKm);
    prevKm = km;
    const segmentH = speedKmPerH > 0 ? segmentKm / speedKmPerH : 0;
    return {
      km,
      carbG: input.carbGPerH * segmentH,
      fluidL: input.fluidIntakeLPerH * segmentH,
      sodiumMg: input.sodiumMgPerH * segmentH,
    };
  });
}
