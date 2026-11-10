import {
  PARTIAL_COMPLIANCE_WEIGHT,
  POST_FTP_DEFAULT_ZONE,
  WEEKLY_COMPLIANCE_REPEAT_THRESHOLD,
} from "./constants";
import type { AdaptOutcome, PlanChange } from "./plan-change";
import { sessionIdFor } from "./plan-change";
import type { PlannedSession, WeekPlan } from "./sessions";
import type { SkillCheckpoint, SkillTracks } from "./skills";

export type AdaptResult<T> = AdaptOutcome<T>;

export type DatedSession = {
  date: string;
  session: PlannedSession;
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

function diffDays(laterIso: string, earlierIso: string): number {
  const later = parseLocalDate(laterIso);
  const earlier = parseLocalDate(earlierIso);
  if (later === null || earlier === null) return 0;
  return Math.round(
    (later.getTime() - earlier.getTime()) / (24 * 60 * 60 * 1000)
  );
}

function cloneWeek(week: WeekPlan): WeekPlan {
  return {
    ...week,
    days: week.days.map((day) => ({
      ...day,
      sessions: day.sessions.map((s) => ({ ...s, targets: { ...s.targets } })),
    })),
  };
}

function cloneTracks(tracks: SkillTracks): SkillTracks {
  return {
    warning: tracks.warning,
    swim: tracks.swim.map((c) => ({ ...c })),
    bike: tracks.bike.map((c) => ({ ...c })),
  };
}

/**
 * A missed key session is never stacked onto the next day (PLAN.md §8.7).
 * Project default: drop it, and swap the intensity onto a later easy session
 * in the same week if one exists.
 */
export function handleMissedKeySession(
  week: WeekPlan,
  missed: { date: string; sport: PlannedSession["sport"] }
): AdaptResult<WeekPlan> {
  const next = cloneWeek(week);
  const day = next.days.find((d) => d.date === missed.date);
  if (day === undefined) {
    return { ok: false, error: "not-found" };
  }

  const index = day.sessions.findIndex(
    (s) => s.sport === missed.sport && s.isHard
  );
  if (index < 0) {
    return { ok: false, error: "not-found" };
  }

  const missedSession = day.sessions[index];
  const changes: PlanChange[] = [
    {
      sessionId: sessionIdFor(missed.date, missed.sport, index),
      kind: "dropped",
      reasonCode: "MISSED_KEY_DROPPED",
      params: { sport: missed.sport },
      source: "MISSED",
    },
  ];
  day.sessions.splice(index, 1);

  const laterDay = next.days.find(
    (d) => d.date > missed.date && d.sessions.some((s) => !s.isHard)
  );
  if (laterDay !== undefined) {
    const laterEasy = laterDay.sessions.find((s) => !s.isHard);
    if (laterEasy !== undefined) {
      laterEasy.isHard = true;
      laterEasy.maxZone = missedSession.maxZone;
      if (laterEasy.targets.kind === "zone" && missedSession.maxZone !== null) {
        laterEasy.targets = { kind: "zone", zone: missedSession.maxZone };
      }
      changes.push({
        sessionId: sessionIdFor(
          laterDay.date,
          laterEasy.sport,
          laterDay.sessions.indexOf(laterEasy)
        ),
        kind: "retargeted",
        reasonCode: "MISSED_KEY_INTENSITY_SWAPPED",
        params: { toDate: laterDay.date, fromDate: missed.date },
        source: "MISSED",
      });
    }
  }

  return { ok: true, value: next, changes };
}

export function computeWeekCompliance(input: {
  planned: number;
  done: number;
  partial: number;
}): number {
  if (input.planned <= 0) return 1;
  const scored =
    input.done + input.partial * PARTIAL_COMPLIANCE_WEIGHT;
  return scored / input.planned;
}

export function shouldRepeatNextLoadWeek(compliance: number): boolean {
  return compliance < WEEKLY_COMPLIANCE_REPEAT_THRESHOLD;
}

/**
 * After a new threshold test, rewrite targets on sessions dated on/after the test.
 */
export function applyNewFitnessTest(input: {
  datedSessions: DatedSession[];
  testDate: string;
  kind: "FTP" | "RUN_THRESHOLD" | "CSS";
  value: number;
}): AdaptResult<DatedSession[]> {
  if (!Number.isFinite(input.value) || input.value <= 0) {
    return { ok: false, error: "non-positive-input" };
  }
  if (parseLocalDate(input.testDate) === null) {
    return { ok: false, error: "invalid-date" };
  }

  const sportForKind =
    input.kind === "FTP" ? "bike" : input.kind === "CSS" ? "swim" : "run";
  const reasonCode =
    input.kind === "FTP"
      ? "NEW_FTP_RETARGET"
      : input.kind === "CSS"
        ? "NEW_CSS_RETARGET"
        : "NEW_RUN_THRESHOLD_RETARGET";

  const changes: PlanChange[] = [];
  const value = input.datedSessions.map((item, index) => {
    const session = {
      ...item.session,
      targets: { ...item.session.targets },
    };
    if (item.date >= input.testDate && session.sport === sportForKind) {
      session.targets = { kind: "zone", zone: POST_FTP_DEFAULT_ZONE };
      changes.push({
        sessionId: sessionIdFor(item.date, session.sport, index),
        kind: "retargeted",
        reasonCode,
        params: { value: input.value, testDate: input.testDate },
        source: "TEST",
      });
    }
    return { date: item.date, session };
  });

  return { ok: true, value, changes };
}

function addDaysIso(iso: string, days: number): string {
  const date = parseLocalDate(iso);
  if (date === null) return iso;
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function replanList(
  list: SkillCheckpoint[],
  today: string
): SkillCheckpoint[] {
  const next = list.map((c) => ({ ...c }));
  let lastOverdueIndex = -1;

  for (let i = 0; i < next.length; i += 1) {
    const checkpoint = next[i];
    if (checkpoint.doneDate !== null) continue;
    if (checkpoint.targetDate >= today) continue;
    lastOverdueIndex = i;
    next[i] = { ...checkpoint, targetDate: today };
  }

  const following = lastOverdueIndex + 1;
  if (lastOverdueIndex >= 0 && following < next.length && next[following].doneDate === null) {
    const gapDays = diffDays(
      list[following].targetDate,
      list[lastOverdueIndex].targetDate
    );
    next[following] = {
      ...next[following],
      targetDate: addDaysIso(today, Math.max(0, gapDays)),
    };
  }

  return next;
}

/**
 * Checkpoints missed past their target date push later targets back
 * and warn if S6/B7 would land after Peak.
 */
export function replanOverdueCheckpoints(
  tracks: SkillTracks,
  today: string,
  peakStartDate: string
): AdaptResult<SkillTracks> {
  if (parseLocalDate(today) === null || parseLocalDate(peakStartDate) === null) {
    return { ok: false, error: "invalid-date" };
  }

  const cloned = cloneTracks(tracks);
  const swim = replanList(cloned.swim, today);
  const bike = replanList(cloned.bike, today);
  const s6 = swim.find((c) => c.code === "S6");
  const b7 = bike.find((c) => c.code === "B7");
  const warning =
    (s6 !== undefined && s6.targetDate > peakStartDate) ||
    (b7 !== undefined && b7.targetDate > peakStartDate)
      ? "checkpoint-past-peak"
      : null;

  return { ok: true, value: { swim, bike, warning }, changes: [] };
}

export function flattenWeekSessions(week: WeekPlan): DatedSession[] {
  return week.days.flatMap((day) =>
    day.sessions.map((session) => ({ date: day.date, session }))
  );
}

export function applyAdaptedSessionsToWeek(
  week: WeekPlan,
  datedSessions: DatedSession[]
): WeekPlan {
  const next = cloneWeek(week);
  for (const day of next.days) {
    const forDay = datedSessions.filter((s) => s.date === day.date);
    day.sessions = forDay.map((s) => s.session);
  }
  return next;
}
