import type { AdaptOutcome, PlanChange } from "./plan-change";
import { sessionIdFor } from "./plan-change";
import type { PlannedSession, WeekPlan } from "./sessions";

function cloneWeek(week: WeekPlan): WeekPlan {
  return {
    ...week,
    days: week.days.map((day) => ({
      ...day,
      sessions: day.sessions.map((s) => ({ ...s, targets: { ...s.targets } })),
    })),
  };
}

/**
 * Empty days in the same week (excluding the origin day).
 * SOURCE: PLAN.md §6.2 missed-session handling
 */
export function listValidMoveSlots(
  week: WeekPlan,
  fromDate: string
): string[] {
  return week.days
    .filter((d) => d.date !== fromDate && d.sessions.length === 0)
    .map((d) => d.date);
}

/**
 * Drop the session. Never stacks onto another day and does not re-assign intensity.
 * SOURCE: PLAN.md §6.2 — skip option
 */
export function skipMissedSession(
  week: WeekPlan,
  missed: { date: string; sport: PlannedSession["sport"] }
): AdaptOutcome<WeekPlan> {
  const next = cloneWeek(week);
  const day = next.days.find((d) => d.date === missed.date);
  if (day === undefined) {
    return { ok: false, error: "not-found" };
  }
  const index = day.sessions.findIndex((s) => s.sport === missed.sport);
  if (index < 0) {
    return { ok: false, error: "not-found" };
  }
  day.sessions.splice(index, 1);
  const changes: PlanChange[] = [
    {
      sessionId: sessionIdFor(missed.date, missed.sport, index),
      kind: "dropped",
      reasonCode: "MISSED_SKIPPED",
      params: { sport: missed.sport },
      source: "MISSED",
    },
  ];
  return { ok: true, value: next, changes };
}

/**
 * Relocate a missed session onto an empty day in the same week.
 * SOURCE: PLAN.md §6.2 — move within the same week
 */
export function moveMissedSession(
  week: WeekPlan,
  input: {
    fromDate: string;
    sport: PlannedSession["sport"];
    toDate: string;
  }
): AdaptOutcome<WeekPlan> {
  const slots = listValidMoveSlots(week, input.fromDate);
  if (!slots.includes(input.toDate)) {
    return { ok: false, error: "slot-unavailable" };
  }

  const next = cloneWeek(week);
  const fromDay = next.days.find((d) => d.date === input.fromDate);
  const toDay = next.days.find((d) => d.date === input.toDate);
  if (fromDay === undefined || toDay === undefined) {
    return { ok: false, error: "not-found" };
  }

  const index = fromDay.sessions.findIndex((s) => s.sport === input.sport);
  if (index < 0) {
    return { ok: false, error: "not-found" };
  }

  const [moved] = fromDay.sessions.splice(index, 1);
  toDay.sessions.push(moved);
  const changes: PlanChange[] = [
    {
      sessionId: sessionIdFor(input.fromDate, input.sport, index),
      kind: "moved",
      reasonCode: "MISSED_MOVED",
      params: { fromDate: input.fromDate, toDate: input.toDate },
      source: "MISSED",
    },
  ];
  return { ok: true, value: next, changes };
}
