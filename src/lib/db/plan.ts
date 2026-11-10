import { buildPhases, type PhasePlan } from "../training/phases";
import {
  generateWeekSessions,
  type DisciplineStatus,
  type WeekPlan,
} from "../training/sessions";
import { getAthlete, type AthleteWithTraining } from "./athlete";

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

  return {
    athlete,
    raceDate: race.date,
    today,
    weekStartMonday,
    phasePlan: phases.value,
    week: week.value,
  };
}
