import {
  HEAT_REFERENCE_WBGT_C,
  HEAT_SLOWDOWN_PCT_PER_5C_WBGT,
  HEAT_STUDIED_MAX_WBGT_C,
} from "./constants";

export type HeatAdjustedPace = {
  adjustedPaceSecPerKm: number;
  slowdownPct: number;
  warning: "extrapolated" | null;
};

export type HeatResult =
  | { ok: true; value: HeatAdjustedPace }
  | { ok: false; error: "non-positive-input" };

/**
 * Adjusts a cool-weather run pace for forecast WBGT.
 * Uses Ely et al. 2007 slowdown of 3.2% per 5 °C above the 5–10 °C reference band.
 */
export function adjustRunPaceForHeat(
  paceSecPerKm: number,
  wbgtC: number
): HeatResult {
  if (!Number.isFinite(paceSecPerKm) || paceSecPerKm <= 0) {
    return { ok: false, error: "non-positive-input" };
  }
  if (!Number.isFinite(wbgtC)) {
    return { ok: false, error: "non-positive-input" };
  }

  const deltaC = Math.max(0, wbgtC - HEAT_REFERENCE_WBGT_C);
  const slowdownPct = (deltaC / 5) * HEAT_SLOWDOWN_PCT_PER_5C_WBGT;
  const adjustedPaceSecPerKm = paceSecPerKm * (1 + slowdownPct / 100);

  return {
    ok: true,
    value: {
      adjustedPaceSecPerKm,
      slowdownPct,
      warning: wbgtC > HEAT_STUDIED_MAX_WBGT_C ? "extrapolated" : null,
    },
  };
}
