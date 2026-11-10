import {
  CUTOFF_SWIM_SEC,
  CUTOFF_SWIM_T1_BIKE_SEC,
  CUTOFF_TOTAL_SEC,
  DEFAULT_SUB600_SPLITS_SEC,
  RACE_BIKE_M,
  RACE_RUN_M,
  RACE_SWIM_M,
} from "./constants";
import { computePaceSecPer100m, computePaceSecPerKm, computeSpeedKph } from "./time";

export type RaceSplits = {
  swimSec: number;
  t1Sec: number;
  bikeSec: number;
  t2Sec: number;
  runSec: number;
};

export type LegMetrics = {
  totalSec: number;
  swimPaceSecPer100m: number;
  bikeSpeedKph: number;
  runPaceSecPerKm: number;
};

export type PacingResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error:
        | "cutoff-swim"
        | "cutoff-swim-t1-bike"
        | "cutoff-total"
        | "no-bike-time-remaining"
        | "non-positive-input"
        | "invalid-input";
    };

export function getDefaultSub600Splits(): RaceSplits {
  return {
    swimSec: DEFAULT_SUB600_SPLITS_SEC.swimSec,
    t1Sec: DEFAULT_SUB600_SPLITS_SEC.t1Sec,
    bikeSec: DEFAULT_SUB600_SPLITS_SEC.bikeSec,
    t2Sec: DEFAULT_SUB600_SPLITS_SEC.t2Sec,
    runSec: DEFAULT_SUB600_SPLITS_SEC.runSec,
  };
}

export function computeLegMetrics(splits: RaceSplits): PacingResult<LegMetrics> {
  const swim = computePaceSecPer100m(RACE_SWIM_M, splits.swimSec);
  const bike = computeSpeedKph(RACE_BIKE_M, splits.bikeSec);
  const run = computePaceSecPerKm(RACE_RUN_M, splits.runSec);

  if (!swim.ok) {
    return {
      ok: false,
      error:
        swim.error === "non-positive-input"
          ? "non-positive-input"
          : "invalid-input",
    };
  }
  if (!bike.ok) {
    return {
      ok: false,
      error:
        bike.error === "non-positive-input"
          ? "non-positive-input"
          : "invalid-input",
    };
  }
  if (!run.ok) {
    return {
      ok: false,
      error:
        run.error === "non-positive-input"
          ? "non-positive-input"
          : "invalid-input",
    };
  }

  return {
    ok: true,
    value: {
      totalSec:
        splits.swimSec +
        splits.t1Sec +
        splits.bikeSec +
        splits.t2Sec +
        splits.runSec,
      swimPaceSecPer100m: swim.value,
      bikeSpeedKph: bike.value,
      runPaceSecPerKm: run.value,
    },
  };
}

export function validateSplitsAgainstCutoffs(
  splits: RaceSplits
): PacingResult<RaceSplits> {
  if (splits.swimSec > CUTOFF_SWIM_SEC) {
    return { ok: false, error: "cutoff-swim" };
  }
  if (splits.swimSec + splits.t1Sec + splits.bikeSec > CUTOFF_SWIM_T1_BIKE_SEC) {
    return { ok: false, error: "cutoff-swim-t1-bike" };
  }
  const total =
    splits.swimSec +
    splits.t1Sec +
    splits.bikeSec +
    splits.t2Sec +
    splits.runSec;
  if (total > CUTOFF_TOTAL_SEC) {
    return { ok: false, error: "cutoff-total" };
  }
  return { ok: true, value: splits };
}

export function computeMinBikeSpeedKph(input: {
  swimPlusT1Sec: number;
  swimT1BikeCutoffSec: number;
  bikeDistanceM: number;
}): PacingResult<number> {
  const { swimPlusT1Sec, swimT1BikeCutoffSec, bikeDistanceM } = input;
  if (
    !Number.isFinite(swimPlusT1Sec) ||
    !Number.isFinite(swimT1BikeCutoffSec) ||
    !Number.isFinite(bikeDistanceM) ||
    swimPlusT1Sec < 0 ||
    swimT1BikeCutoffSec <= 0 ||
    bikeDistanceM <= 0
  ) {
    return { ok: false, error: "non-positive-input" };
  }
  const bikeTimeSec = swimT1BikeCutoffSec - swimPlusT1Sec;
  if (bikeTimeSec <= 0) {
    return { ok: false, error: "no-bike-time-remaining" };
  }
  const speed = computeSpeedKph(bikeDistanceM, bikeTimeSec);
  if (!speed.ok) {
    return { ok: false, error: "invalid-input" };
  }
  return { ok: true, value: speed.value };
}
