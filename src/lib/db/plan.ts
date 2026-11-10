import { FitnessTestKind, WorkoutStatus } from "@prisma/client";
import {
  applyAdaptedSessionsToWeek,
  applyNewFitnessTest,
  computeWeekCompliance,
  flattenWeekSessions,
  handleMissedKeySession,
  replanOverdueCheckpoints,
  shouldRepeatNextLoadWeek,
} from "../training/adapt";
import { moveMissedSession, skipMissedSession } from "../training/missed";
import { buildPhases, type PhasePlan } from "../training/phases";
import {
  generateWeekSessions,
  type DisciplineStatus,
  type PlannedSession,
  type WeekPlan,
} from "../training/sessions";
import {
  getAthlete,
  latestTestValue,
  saveSkillTracks,
  type AthleteWithTraining,
} from "./athlete";
import { tracksFromDb, tracksToRows } from "./tracks";

const DEFAULT_WEEKLY_HOURS = 10;
const DEFAULT_REST_DAYS = [1];
const DEFAULT_LONG_DAY = 7;
const RACE_TIMEZONE = "Asia/Ho_Chi_Minh";

export type LoadedPlan = {
  athlete: AthleteWithTraining;
  raceDate: string;
  today: string;
  weekStartMonday: string;
  phasePlan: PhasePlan;
  week: WeekPlan;
  repeatNextLoadWeek: boolean;
  checkpointWarning: "checkpoint-past-peak" | null;
};

export function calendarDateInZone(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function mondayOfWeek(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.getDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  date.setDate(date.getDate() - offset);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toDiscipline(status: string): DisciplineStatus {
  return status === "ZONES" ? "zones" : "skill";
}

function restDaysFromJson(value: unknown): number[] {
  if (!Array.isArray(value)) return DEFAULT_REST_DAYS;
  const days = value.filter(
    (d): d is number => typeof d === "number" && d >= 1 && d <= 7
  );
  return days.length > 0 ? days : DEFAULT_REST_DAYS;
}

export async function loadWeekPlan(now: Date): Promise<LoadedPlan | null> {
  const athlete = await getAthlete();
  if (athlete === null || athlete.races.length === 0) {
    return null;
  }

  const race = athlete.races[0];
  const today = calendarDateInZone(now, RACE_TIMEZONE);
  const weekStartMonday = mondayOfWeek(today);
  const phases = buildPhases(
    race.date,
    today,
    athlete.recoveryBlockWeeks
  );
  if (!phases.ok) {
    return null;
  }

  const week = generateWeekSessions({
    weekStartMonday,
    raceDate: race.date,
    today,
    athlete: {
      weeklyHoursAvailable: athlete.weeklyHoursAvailable ?? DEFAULT_WEEKLY_HOURS,
      restDays: restDaysFromJson(athlete.restDays),
      longDay: athlete.longDay ?? DEFAULT_LONG_DAY,
      recoveryBlockWeeks: athlete.recoveryBlockWeeks,
      disciplineStatus: {
        swim: toDiscipline(athlete.swimStatus),
        bike: toDiscipline(athlete.bikeStatus),
        run: toDiscipline(athlete.runStatus),
      },
      hasBike: athlete.hasBike,
      bikeFitDone: athlete.bikeFitDone,
    },
    phasePlan: phases.value,
  });
  if (!week.ok) {
    return null;
  }

  let adapted = week.value;
  const weekLogs = athlete.workoutLogs.filter(
    (log) => log.date >= weekStartMonday && log.date <= adapted.days[6]?.date
  );

  const missedLogs = weekLogs.filter((log) => log.status === WorkoutStatus.MISSED);
  for (const log of missedLogs) {
    const sport = prismaSportToSession(log.sport);
    if (sport === null) continue;

    if (log.movedToDate === "skip") {
      const skipped = skipMissedSession(adapted, { date: log.date, sport });
      if (skipped.ok) adapted = skipped.value;
      continue;
    }

    if (log.movedToDate !== null && /^\d{4}-\d{2}-\d{2}$/.test(log.movedToDate)) {
      const moved = moveMissedSession(adapted, {
        fromDate: log.date,
        sport,
        toDate: log.movedToDate,
      });
      if (moved.ok) adapted = moved.value;
      continue;
    }

    const day = adapted.days.find((d) => d.date === log.date);
    const wasHard = day?.sessions.some((s) => s.sport === sport && s.isHard) ?? false;
    if (!wasHard) {
      const skipped = skipMissedSession(adapted, { date: log.date, sport });
      if (skipped.ok) adapted = skipped.value;
      continue;
    }
    const missed = handleMissedKeySession(adapted, { date: log.date, sport });
    if (missed.ok) adapted = missed.value;
  }

  const ftp = latestTestValue(athlete.fitnessTests, FitnessTestKind.FTP);
  if (ftp !== null) {
    const applied = applyNewFitnessTest({
      datedSessions: flattenWeekSessions(adapted),
      testDate: ftp.date,
      kind: "FTP",
      value: ftp.value,
    });
    if (applied.ok) {
      adapted = applyAdaptedSessionsToWeek(adapted, applied.value);
    }
  }

  const peak = phases.value.phases.find((p) => p.name === "Peak");
  const tracks = replanOverdueCheckpoints(
    tracksFromDb(athlete.skillCheckpoints),
    today,
    peak?.startDate ?? race.date
  );
  const checkpointWarning = tracks.ok ? tracks.value.warning : null;
  if (tracks.ok) {
    const rows = tracksToRows(tracks.value);
    const changed = rows.some((row) => {
      const existing = athlete.skillCheckpoints.find((c) => c.code === row.code);
      return (
        existing === undefined ||
        existing.targetDate !== row.targetDate ||
        existing.doneDate !== row.doneDate
      );
    });
    if (changed) {
      await saveSkillTracks(athlete.id, rows);
    }
  }

  const elapsedDates = new Set(
    adapted.days.filter((d) => d.date < today).map((d) => d.date)
  );
  const plannedCount = adapted.days
    .filter((d) => elapsedDates.has(d.date))
    .reduce((n, d) => n + d.sessions.length, 0);
  const elapsedLogs = weekLogs.filter((l) => elapsedDates.has(l.date));
  const done = elapsedLogs.filter((l) => l.status === WorkoutStatus.DONE).length;
  const partial = elapsedLogs.filter((l) => l.status === WorkoutStatus.PARTIAL).length;
  const compliance = computeWeekCompliance({
    planned: plannedCount,
    done,
    partial,
  });

  return {
    athlete,
    raceDate: race.date,
    today,
    weekStartMonday,
    phasePlan: phases.value,
    week: adapted,
    repeatNextLoadWeek: shouldRepeatNextLoadWeek(compliance),
    checkpointWarning,
  };
}

function prismaSportToSession(
  sport: string
): PlannedSession["sport"] | null {
  const lower = sport.toLowerCase();
  if (
    lower === "swim" ||
    lower === "bike" ||
    lower === "run" ||
    lower === "brick" ||
    lower === "strength"
  ) {
    return lower;
  }
  return null;
}
