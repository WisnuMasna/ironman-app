import { getAthlete } from "@/lib/db/athlete";
import { loadWeekPlan } from "@/lib/db/plan";
import { buildIcsCalendar } from "@/lib/training/ics";
import { buildPhases } from "@/lib/training/phases";
import { generateWeekSessions } from "@/lib/training/sessions";
import { requestNow } from "@/app/request-now";

const RACE_TIMEZONE = "Asia/Ho_Chi_Minh";
const WEEKS_AHEAD = 4;
const DEFAULT_WEEKLY_HOURS = 10;
const DEFAULT_REST_DAYS = [1];
const DEFAULT_LONG_DAY = 7;

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function restDaysFromJson(value: unknown): number[] {
  if (!Array.isArray(value)) return DEFAULT_REST_DAYS;
  const days = value.filter(
    (d): d is number => typeof d === "number" && d >= 1 && d <= 7
  );
  return days.length > 0 ? days : DEFAULT_REST_DAYS;
}

export async function GET(): Promise<Response> {
  const now = await requestNow();
  const current = await loadWeekPlan(now);
  if (current === null) {
    return new Response("No athlete", { status: 404 });
  }

  const athlete = await getAthlete();
  if (athlete === null || athlete.races.length === 0) {
    return new Response("No athlete", { status: 404 });
  }

  const race = athlete.races[0];
  const events: Array<{
    date: string;
    startHourLocal: number;
    session: (typeof current.week.days)[0]["sessions"][0];
  }> = [];

  for (let w = 0; w < WEEKS_AHEAD; w += 1) {
    const weekStart = addDaysIso(current.weekStartMonday, w * 7);
    const phases = buildPhases(
      race.date,
      current.today,
      athlete.recoveryBlockWeeks
    );
    if (!phases.ok) continue;
    const week = generateWeekSessions({
      weekStartMonday: weekStart,
      raceDate: race.date,
      today: current.today,
      athlete: {
        weeklyHoursAvailable:
          athlete.weeklyHoursAvailable ?? DEFAULT_WEEKLY_HOURS,
        restDays: restDaysFromJson(athlete.restDays),
        longDay: athlete.longDay ?? DEFAULT_LONG_DAY,
        recoveryBlockWeeks: athlete.recoveryBlockWeeks,
        disciplineStatus: {
          swim: athlete.swimStatus === "ZONES" ? "zones" : "skill",
          bike: athlete.bikeStatus === "ZONES" ? "zones" : "skill",
          run: athlete.runStatus === "ZONES" ? "zones" : "skill",
        },
        hasBike: athlete.hasBike,
        bikeFitDone: athlete.bikeFitDone,
      },
      phasePlan: phases.value,
    });
    if (!week.ok) continue;
    for (const day of week.value.days) {
      for (const session of day.sessions) {
        events.push({
          date: day.date,
          startHourLocal: 6,
          session,
        });
      }
    }
  }

  const ics = buildIcsCalendar({
    calendarName: `${race.name} training`,
    timezone: RACE_TIMEZONE,
    events,
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="training.ics"',
    },
  });
}
