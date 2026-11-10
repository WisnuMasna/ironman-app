import {
  VDOT_DISTANCE_TOLERANCE_M,
  VDOT_HALF_MARATHON_M,
  VDOT_MARATHON_M,
  VDOT_TABLE,
} from "./constants";

export type VdotEstimate = {
  vdot: number;
  thresholdPaceSecPerKm: number;
  estimated: true;
};

export type VdotResult =
  | { ok: true; value: VdotEstimate }
  | {
      ok: false;
      error:
        | "unsupported-distance"
        | "out-of-table"
        | "non-positive-input";
    };

type VdotDistanceKey = "halfMarathonSec" | "marathonSec";
type VdotTableRow = (typeof VDOT_TABLE)[number];

function resolveDistanceKey(distanceM: number): VdotDistanceKey | null {
  if (Math.abs(distanceM - VDOT_HALF_MARATHON_M) <= VDOT_DISTANCE_TOLERANCE_M) {
    return "halfMarathonSec";
  }
  if (Math.abs(distanceM - VDOT_MARATHON_M) <= VDOT_DISTANCE_TOLERANCE_M) {
    return "marathonSec";
  }
  return null;
}

/**
 * Estimates Daniels VDOT and threshold run pace (sec/km) from a recent race.
 * Result is always flagged `estimated: true` until a field test replaces it.
 */
export function estimateRunThresholdFromRace(
  distanceM: number,
  timeSec: number
): VdotResult {
  if (
    !Number.isFinite(distanceM) ||
    !Number.isFinite(timeSec) ||
    distanceM <= 0 ||
    timeSec <= 0
  ) {
    return { ok: false, error: "non-positive-input" };
  }

  const distanceKey = resolveDistanceKey(distanceM);
  if (distanceKey === null) {
    return { ok: false, error: "unsupported-distance" };
  }

  const fastest = VDOT_TABLE[VDOT_TABLE.length - 1][distanceKey];
  const slowest = VDOT_TABLE[0][distanceKey];
  if (timeSec < fastest || timeSec > slowest) {
    return { ok: false, error: "out-of-table" };
  }

  // Exact row match.
  for (const row of VDOT_TABLE) {
    if (row[distanceKey] === timeSec) {
      return {
        ok: true,
        value: {
          vdot: row.vdot,
          thresholdPaceSecPerKm: row.thresholdPaceSecPerKm,
          estimated: true,
        },
      };
    }
  }

  // Find bracketing rows: faster (lower time, higher VDOT) and slower (higher time, lower VDOT).
  let slowerRow: VdotTableRow = VDOT_TABLE[0];
  let fasterRow: VdotTableRow = VDOT_TABLE[1];
  for (let i = 0; i < VDOT_TABLE.length - 1; i += 1) {
    const lowVdot = VDOT_TABLE[i];
    const highVdot = VDOT_TABLE[i + 1];
    if (
      timeSec <= lowVdot[distanceKey] &&
      timeSec >= highVdot[distanceKey]
    ) {
      slowerRow = lowVdot;
      fasterRow = highVdot;
      break;
    }
  }

  const slowTime = slowerRow[distanceKey];
  const fastTime = fasterRow[distanceKey];
  const span = slowTime - fastTime;
  const fraction = span === 0 ? 0 : (slowTime - timeSec) / span;

  const vdot =
    slowerRow.vdot + fraction * (fasterRow.vdot - slowerRow.vdot);
  const thresholdPaceSecPerKm =
    slowerRow.thresholdPaceSecPerKm +
    fraction *
      (fasterRow.thresholdPaceSecPerKm - slowerRow.thresholdPaceSecPerKm);

  return {
    ok: true,
    value: {
      vdot,
      thresholdPaceSecPerKm,
      estimated: true,
    },
  };
}
