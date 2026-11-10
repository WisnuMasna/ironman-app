export type TimeResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: "invalid-format" | "negative-value" | "non-positive-input";
    };

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const METRES_PER_KM = 1000;
const METRES_PER_100M = 100;

function padTwoDigits(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Parses a duration string formatted as `h:mm:ss` or `mm:ss` (or `m:ss`) into integer seconds.
 * Minutes (when hours are present) and seconds must be two digits in `00..59`.
 */
export function parseDurationHms(input: string): TimeResult<number> {
  if (input.length === 0 || input.trim() !== input) {
    return { ok: false, error: "invalid-format" };
  }

  const hmsMatch = /^(\d+):([0-5]\d):([0-5]\d)$/.exec(input);
  if (hmsMatch) {
    const hours = Number(hmsMatch[1]);
    const minutes = Number(hmsMatch[2]);
    const seconds = Number(hmsMatch[3]);
    return {
      ok: true,
      value:
        hours * SECONDS_PER_HOUR + minutes * SECONDS_PER_MINUTE + seconds,
    };
  }

  const msMatch = /^(\d+):([0-5]\d)$/.exec(input);
  if (msMatch) {
    const minutes = Number(msMatch[1]);
    const seconds = Number(msMatch[2]);
    return {
      ok: true,
      value: minutes * SECONDS_PER_MINUTE + seconds,
    };
  }

  return { ok: false, error: "invalid-format" };
}

/**
 * Formats a duration in seconds (rounded to nearest integer second) into `h:mm:ss`.
 */
export function formatDurationHms(durationSec: number): string {
  const totalSec = Math.max(0, Math.round(durationSec));
  const hours = Math.floor(totalSec / SECONDS_PER_HOUR);
  const remainingAfterHours = totalSec % SECONDS_PER_HOUR;
  const minutes = Math.floor(remainingAfterHours / SECONDS_PER_MINUTE);
  const seconds = remainingAfterHours % SECONDS_PER_MINUTE;

  return `${hours}:${padTwoDigits(minutes)}:${padTwoDigits(seconds)}`;
}

/**
 * Formats a pace in seconds (rounded to nearest integer second) into `m:ss`
 * (or `h:mm:ss` when the rounded pace is 1 hour or longer).
 */
export function formatPaceMmSs(paceSec: number): string {
  const totalSec = Math.max(0, Math.round(paceSec));
  if (totalSec >= SECONDS_PER_HOUR) {
    return formatDurationHms(totalSec);
  }
  const minutes = Math.floor(totalSec / SECONDS_PER_MINUTE);
  const seconds = totalSec % SECONDS_PER_MINUTE;
  return `${minutes}:${padTwoDigits(seconds)}`;
}

/**
 * Computes running pace in seconds per kilometre from distance in metres and duration in seconds.
 */
export function computePaceSecPerKm(
  distanceM: number,
  durationSec: number
): TimeResult<number> {
  if (!Number.isFinite(distanceM) || distanceM <= 0) {
    return { ok: false, error: "non-positive-input" };
  }
  if (!Number.isFinite(durationSec) || durationSec < 0) {
    return { ok: false, error: "negative-value" };
  }
  return {
    ok: true,
    value: (durationSec * METRES_PER_KM) / distanceM,
  };
}

/**
 * Formats a running pace (sec/km) as `m:ss/km` (or `h:mm:ss/km` if >= 1 h).
 */
export function formatPaceMinPerKm(paceSecPerKm: number): string {
  return `${formatPaceMmSs(paceSecPerKm)}/km`;
}

/**
 * Computes swimming pace in seconds per 100 metres from distance in metres and duration in seconds.
 */
export function computePaceSecPer100m(
  distanceM: number,
  durationSec: number
): TimeResult<number> {
  if (!Number.isFinite(distanceM) || distanceM <= 0) {
    return { ok: false, error: "non-positive-input" };
  }
  if (!Number.isFinite(durationSec) || durationSec < 0) {
    return { ok: false, error: "negative-value" };
  }
  return {
    ok: true,
    value: (durationSec * METRES_PER_100M) / distanceM,
  };
}

/**
 * Formats a swimming pace (sec/100m) as `m:ss/100m`.
 */
export function formatPacePer100m(paceSecPer100m: number): string {
  return `${formatPaceMmSs(paceSecPer100m)}/100m`;
}

/**
 * Converts pace in seconds per kilometre to speed in kilometres per hour.
 */
export function paceSecPerKmToSpeedKph(
  paceSecPerKm: number
): TimeResult<number> {
  if (!Number.isFinite(paceSecPerKm) || paceSecPerKm <= 0) {
    return { ok: false, error: "non-positive-input" };
  }
  return {
    ok: true,
    value: SECONDS_PER_HOUR / paceSecPerKm,
  };
}

/**
 * Converts speed in kilometres per hour to pace in seconds per kilometre.
 */
export function speedKphToPaceSecPerKm(speedKph: number): TimeResult<number> {
  if (!Number.isFinite(speedKph) || speedKph <= 0) {
    return { ok: false, error: "non-positive-input" };
  }
  return {
    ok: true,
    value: SECONDS_PER_HOUR / speedKph,
  };
}

/**
 * Computes speed in kilometres per hour from distance in metres and duration in seconds.
 */
export function computeSpeedKph(
  distanceM: number,
  durationSec: number
): TimeResult<number> {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    return { ok: false, error: "non-positive-input" };
  }
  if (!Number.isFinite(distanceM) || distanceM < 0) {
    return { ok: false, error: "negative-value" };
  }
  return {
    ok: true,
    value: (distanceM / METRES_PER_KM) / (durationSec / SECONDS_PER_HOUR),
  };
}
