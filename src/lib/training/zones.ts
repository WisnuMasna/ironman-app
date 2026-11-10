import {
  COGGAN_POWER_ZONE_BOUNDS,
  CSS_DISTANCE_PAIR_DIVISOR,
  FRIEL_BIKE_HR_ZONE_BOUNDS,
  FRIEL_RUN_HR_ZONE_BOUNDS,
  FRIEL_RUN_PACE_ZONE_BOUNDS,
  SWIM_CSS_ZONE_OFFSETS,
} from "./constants";

export type ZoneResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: "test-needed" | "non-positive-input" | "invalid-input";
    };

export type PowerZone = {
  zone: string;
  label: string;
  minWatts: number;
  maxWatts: number | null;
};

export type PaceZone = {
  zone: string;
  label: string;
  minPaceSecPerKm: number | null;
  maxPaceSecPerKm: number | null;
};

export type HrZone = {
  zone: string;
  label: string;
  minHr: number;
  maxHr: number | null;
};

export type SwimPaceZone = {
  zone: string;
  label: string;
  minPaceSecPer100m: number | null;
  maxPaceSecPer100m: number | null;
};

function pctOf(value: number, pct: number): number {
  return Math.round((value * pct) / 100);
}

/**
 * Builds Coggan power zones from FTP in watts.
 * Returns `{ ok: false, error: 'test-needed' }` when FTP has not been tested yet.
 */
export function buildCogganPowerZones(
  ftpWatts: number | null
): ZoneResult<PowerZone[]> {
  if (ftpWatts === null) {
    return { ok: false, error: "test-needed" };
  }
  if (!Number.isFinite(ftpWatts) || ftpWatts <= 0) {
    return { ok: false, error: "non-positive-input" };
  }

  const value: PowerZone[] = COGGAN_POWER_ZONE_BOUNDS.map((bound) => {
    if (bound.maxPctFtp === null) {
      // Z7: strictly greater than 150% FTP.
      return {
        zone: bound.zone,
        label: bound.label,
        minWatts: pctOf(ftpWatts, bound.minPctFtp) + 1,
        maxWatts: null,
      };
    }
    return {
      zone: bound.zone,
      label: bound.label,
      minWatts: pctOf(ftpWatts, bound.minPctFtp),
      maxWatts: pctOf(ftpWatts, bound.maxPctFtp),
    };
  });

  return { ok: true, value };
}

/**
 * Builds Friel run pace zones from threshold pace (sec/km).
 * Higher % of threshold pace means a slower (higher sec/km) zone bound.
 */
export function buildFrielRunPaceZones(
  thresholdPaceSecPerKm: number | null
): ZoneResult<PaceZone[]> {
  if (thresholdPaceSecPerKm === null) {
    return { ok: false, error: "test-needed" };
  }
  if (!Number.isFinite(thresholdPaceSecPerKm) || thresholdPaceSecPerKm <= 0) {
    return { ok: false, error: "non-positive-input" };
  }

  const value: PaceZone[] = FRIEL_RUN_PACE_ZONE_BOUNDS.map((bound) => {
    if (bound.zone === "Z1") {
      // Slower than 129% of threshold pace.
      const boundary = pctOf(
        thresholdPaceSecPerKm,
        bound.minPctThresholdPace ?? 129
      );
      return {
        zone: bound.zone,
        label: bound.label,
        minPaceSecPerKm: boundary + 1,
        maxPaceSecPerKm: null,
      };
    }
    if (bound.zone === "Z5c") {
      // Faster than 90% of threshold pace.
      const boundary = pctOf(
        thresholdPaceSecPerKm,
        bound.maxPctThresholdPace ?? 90
      );
      return {
        zone: bound.zone,
        label: bound.label,
        minPaceSecPerKm: null,
        maxPaceSecPerKm: boundary - 1,
      };
    }
    return {
      zone: bound.zone,
      label: bound.label,
      minPaceSecPerKm:
        bound.minPctThresholdPace === null
          ? null
          : pctOf(thresholdPaceSecPerKm, bound.minPctThresholdPace),
      maxPaceSecPerKm:
        bound.maxPctThresholdPace === null
          ? null
          : pctOf(thresholdPaceSecPerKm, bound.maxPctThresholdPace),
    };
  });

  return { ok: true, value };
}

function buildFrielHrZones(
  lthr: number | null,
  bounds: typeof FRIEL_RUN_HR_ZONE_BOUNDS | typeof FRIEL_BIKE_HR_ZONE_BOUNDS
): ZoneResult<HrZone[]> {
  if (lthr === null) {
    return { ok: false, error: "test-needed" };
  }
  if (!Number.isFinite(lthr) || lthr <= 0) {
    return { ok: false, error: "non-positive-input" };
  }

  const value: HrZone[] = bounds.map((bound) => {
    if (bound.minPctLthr === null && bound.maxPctLthr !== null) {
      // Open low end: Z1 < X%
      return {
        zone: bound.zone,
        label: bound.label,
        minHr: 0,
        maxHr: pctOf(lthr, bound.maxPctLthr) - 1,
      };
    }
    if (bound.maxPctLthr === null && bound.minPctLthr !== null) {
      // Open high end: Z5c > X% — start just above the listed floor percentage.
      // PLAN lists Z5b up to 106 and Z5c >106, so min is round(106%)+1 when
      // the constant stores 106 as the exclusive floor marker.
      return {
        zone: bound.zone,
        label: bound.label,
        minHr: pctOf(lthr, bound.minPctLthr) + 1,
        maxHr: null,
      };
    }
    return {
      zone: bound.zone,
      label: bound.label,
      minHr: pctOf(lthr, bound.minPctLthr ?? 0),
      maxHr:
        bound.maxPctLthr === null ? null : pctOf(lthr, bound.maxPctLthr),
    };
  });

  return { ok: true, value };
}

export function buildFrielRunHrZones(
  lthr: number | null
): ZoneResult<HrZone[]> {
  return buildFrielHrZones(lthr, FRIEL_RUN_HR_ZONE_BOUNDS);
}

export function buildFrielBikeHrZones(
  lthr: number | null
): ZoneResult<HrZone[]> {
  return buildFrielHrZones(lthr, FRIEL_BIKE_HR_ZONE_BOUNDS);
}

/**
 * Critical Swim Speed (sec/100 m) from a 400 m and 200 m time trial.
 * CSS = (T400 − T200) / 2.
 */
export function computeCssSecPer100m(
  t400Sec: number | null,
  t200Sec: number | null
): ZoneResult<number> {
  if (t400Sec === null || t200Sec === null) {
    return { ok: false, error: "test-needed" };
  }
  if (
    !Number.isFinite(t400Sec) ||
    !Number.isFinite(t200Sec) ||
    t400Sec <= 0 ||
    t200Sec <= 0
  ) {
    return { ok: false, error: "non-positive-input" };
  }
  if (t400Sec <= t200Sec) {
    return { ok: false, error: "invalid-input" };
  }
  return {
    ok: true,
    value: (t400Sec - t200Sec) / CSS_DISTANCE_PAIR_DIVISOR,
  };
}

/**
 * Builds swim pace zones as CSS ± offset seconds per 100 m.
 */
export function buildSwimCssZones(
  cssSecPer100m: number | null
): ZoneResult<SwimPaceZone[]> {
  if (cssSecPer100m === null) {
    return { ok: false, error: "test-needed" };
  }
  if (!Number.isFinite(cssSecPer100m) || cssSecPer100m <= 0) {
    return { ok: false, error: "non-positive-input" };
  }

  const value: SwimPaceZone[] = SWIM_CSS_ZONE_OFFSETS.map((bound) => ({
    zone: bound.zone,
    label: bound.label,
    minPaceSecPer100m:
      bound.minOffsetSec === null ? null : cssSecPer100m + bound.minOffsetSec,
    maxPaceSecPer100m:
      bound.maxOffsetSec === null ? null : cssSecPer100m + bound.maxOffsetSec,
  }));

  return { ok: true, value };
}
