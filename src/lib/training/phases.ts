import {
  PHASE_BASE_WEEKS,
  PHASE_BUILD_WEEKS,
  PHASE_PEAK_WEEKS,
  PHASE_TAPER_WEEKS,
} from "./constants";

export type PhaseName = "Prep" | "Base" | "Build" | "Peak" | "Taper";

export type Phase = {
  name: PhaseName;
  startDate: string;
  endDate: string;
  startWeekOut: number;
  endWeekOut: number;
};

export type PhasePlan = {
  phases: Phase[];
  recoveryWeekStartDates: string[];
  raceWeekMonday: string;
};

export type PhaseResult =
  | { ok: true; value: PhasePlan }
  | {
      ok: false;
      error: "invalid-date" | "today-after-race" | "non-positive-input";
    };

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseLocalDate(iso: string): Date | null {
  const match = DATE_RE.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function mondayOnOrBefore(date: Date): Date {
  // JS: Sunday=0 … Saturday=6. Weeks start Monday.
  const day = date.getDay();
  const offset = day === 0 ? 6 : day - 1;
  return addDays(date, -offset);
}

function compareIso(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function maxIso(a: string, b: string): string {
  return compareIso(a, b) >= 0 ? a : b;
}

function minIso(a: string, b: string): string {
  return compareIso(a, b) <= 0 ? a : b;
}

/**
 * Builds periodised phases counted back from race day.
 * Weeks start Monday; race week is week 1. Shrinks Prep first, then Base;
 * taper is always `PHASE_TAPER_WEEKS` when the race is still ahead.
 */
export function buildPhases(
  raceDate: string,
  today: string,
  recoveryBlockWeeks: number
): PhaseResult {
  if (!Number.isFinite(recoveryBlockWeeks) || recoveryBlockWeeks <= 0) {
    return { ok: false, error: "non-positive-input" };
  }

  const race = parseLocalDate(raceDate);
  const todayDate = parseLocalDate(today);
  if (race === null || todayDate === null) {
    return { ok: false, error: "invalid-date" };
  }
  if (compareIso(today, raceDate) > 0) {
    return { ok: false, error: "today-after-race" };
  }

  const raceWeekMonday = mondayOnOrBefore(race);
  const raceWeekMondayIso = formatLocalDate(raceWeekMonday);

  // Ideal phase windows by weeks-out (inclusive week numbers).
  const taperStartWeek = 1;
  const taperEndWeek = PHASE_TAPER_WEEKS; // 2
  const peakStartWeek = PHASE_TAPER_WEEKS + 1; // 3
  const peakEndWeek = PHASE_TAPER_WEEKS + PHASE_PEAK_WEEKS; // 3
  const buildStartWeek = peakEndWeek + 1; // 4
  const buildEndWeek = peakEndWeek + PHASE_BUILD_WEEKS; // 12
  const idealBaseStartWeek = buildEndWeek + 1; // 13
  const idealBaseEndWeek = buildEndWeek + PHASE_BASE_WEEKS; // 24

  const weekStart = (weekOut: number): Date =>
    addDays(raceWeekMonday, -(weekOut - 1) * 7);
  const weekEnd = (weekOut: number): Date => addDays(weekStart(weekOut), 6);

  const idealTaperStart = formatLocalDate(weekStart(taperEndWeek));
  const idealTaperEnd = raceDate;
  const idealPeakStart = formatLocalDate(weekStart(peakEndWeek));
  const idealPeakEnd = formatLocalDate(weekEnd(peakStartWeek));
  const idealBuildStart = formatLocalDate(weekStart(buildEndWeek));
  const idealBuildEnd = formatLocalDate(weekEnd(buildStartWeek));
  const idealBaseStart = formatLocalDate(weekStart(idealBaseEndWeek));
  const idealBaseEnd = formatLocalDate(weekEnd(idealBaseStartWeek));

  // Available calendar from today through race.
  // Shrink Prep first (Prep = today .. day before Base), then shrink Base start forward.
  let baseStart = idealBaseStart;
  let prepStart: string | null = today;
  let prepEnd: string | null = formatLocalDate(addDays(parseLocalDate(idealBaseStart)!, -1));

  if (compareIso(today, idealBaseStart) >= 0) {
    // Prep fully shrunk; Base starts at today (may truncate Base).
    prepStart = null;
    prepEnd = null;
    baseStart = today;
  } else if (compareIso(today, idealBaseStart) < 0) {
    prepStart = today;
    prepEnd = formatLocalDate(addDays(parseLocalDate(idealBaseStart)!, -1));
    if (prepStart > prepEnd) {
      prepStart = null;
      prepEnd = null;
    }
  }

  // If today is inside Build/Peak/Taper, Base may also be gone.
  let baseEnd = idealBaseEnd;
  if (compareIso(baseStart, idealBaseEnd) > 0) {
    // Base fully shrunk.
    baseEnd = baseStart;
  }

  const phases: Phase[] = [];

  if (prepStart !== null && prepEnd !== null && compareIso(prepStart, prepEnd) <= 0) {
    phases.push({
      name: "Prep",
      startDate: prepStart,
      endDate: prepEnd,
      startWeekOut: idealBaseEndWeek + 1,
      endWeekOut: idealBaseEndWeek + 1,
    });
  }

  if (
    compareIso(baseStart, idealBuildStart) < 0 &&
    compareIso(baseStart, baseEnd) <= 0
  ) {
    const clampedBaseEnd = minIso(baseEnd, formatLocalDate(addDays(parseLocalDate(idealBuildStart)!, -1)));
    if (compareIso(baseStart, clampedBaseEnd) <= 0) {
      phases.push({
        name: "Base",
        startDate: baseStart,
        endDate: clampedBaseEnd,
        startWeekOut: idealBaseEndWeek,
        endWeekOut: idealBaseStartWeek,
      });
    }
  }

  // Build / Peak / Taper: clamp start to today, never shrink taper length from the race end.
  const maybePush = (
    name: PhaseName,
    start: string,
    end: string,
    startWeekOut: number,
    endWeekOut: number
  ): void => {
    const clampedStart = maxIso(start, today);
    if (compareIso(clampedStart, end) <= 0) {
      phases.push({
        name,
        startDate: clampedStart,
        endDate: end,
        startWeekOut,
        endWeekOut,
      });
    }
  };

  maybePush(
    "Build",
    idealBuildStart,
    idealBuildEnd,
    buildEndWeek,
    buildStartWeek
  );
  maybePush("Peak", idealPeakStart, idealPeakEnd, peakEndWeek, peakStartWeek);
  maybePush(
    "Taper",
    idealTaperStart,
    idealTaperEnd,
    taperEndWeek,
    taperStartWeek
  );

  // Recovery weeks: last week of every `recoveryBlockWeeks` block inside Base and Build,
  // counting forward from each phase start Monday.
  const recoveryWeekStartDates: string[] = [];
  for (const phase of phases) {
    if (phase.name !== "Base" && phase.name !== "Build") continue;
    const phaseStart = parseLocalDate(phase.startDate)!;
    const phaseEnd = parseLocalDate(phase.endDate)!;
    let cursor = mondayOnOrBefore(phaseStart);
    // If phase starts mid-week, first full week Monday may be the next Monday.
    if (compareIso(formatLocalDate(cursor), phase.startDate) < 0) {
      cursor = addDays(cursor, 7);
    }
    let weekIndex = 1;
    while (compareIso(formatLocalDate(cursor), phase.endDate) <= 0) {
      const weekEndDate = addDays(cursor, 6);
      if (compareIso(formatLocalDate(weekEndDate), phase.endDate) > 0) break;
      if (weekIndex % recoveryBlockWeeks === 0) {
        recoveryWeekStartDates.push(formatLocalDate(cursor));
      }
      cursor = addDays(cursor, 7);
      weekIndex += 1;
    }
  }

  return {
    ok: true,
    value: {
      phases,
      recoveryWeekStartDates,
      raceWeekMonday: raceWeekMondayIso,
    },
  };
}
