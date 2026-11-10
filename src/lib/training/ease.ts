import { EASE_BACK_MISSED_DAYS_THRESHOLD, EASE_BACK_VOLUME_FRACTION } from "./constants";
import type { AdaptOutcome, PlanChange } from "./plan-change";
import { sessionIdFor } from "./plan-change";
import type { WeekPlan } from "./sessions";

function cloneWeek(week: WeekPlan): WeekPlan {
  return {
    ...week,
    days: week.days.map((day) => ({
      ...day,
      sessions: day.sessions.map((s) => ({ ...s, targets: { ...s.targets } })),
    })),
  };
}

function isHardZone(zone: string | null): boolean {
  if (zone === null) return false;
  return zone === "Z4" || zone === "Z5" || zone.startsWith("Z5");
}

/**
 * After enough missed days, build a lighter re-entry week: lower volume, no Z4+.
 * SOURCE: PLAN.md §8.7 Ease me back in
 */
export function easeBackIn(
  week: WeekPlan,
  missedDays: number,
  today: string
): AdaptOutcome<WeekPlan> {
  // `today` reserved for dated re-entry windows; kept in the signature (PLAN.md §8.7).
  if (today.length === 0) {
    return { ok: false, error: "invalid-date" };
  }
  if (missedDays < EASE_BACK_MISSED_DAYS_THRESHOLD) {
    return { ok: true, value: cloneWeek(week), changes: [] };
  }

  const next = cloneWeek(week);
  const changes: PlanChange[] = [];
  const volumePct = Math.round(EASE_BACK_VOLUME_FRACTION * 100);

  for (const day of next.days) {
    day.sessions = day.sessions.map((session, index) => {
      const id = sessionIdFor(day.date, session.sport, index);
      let updated = { ...session, targets: { ...session.targets } };
      const newDuration = Math.max(
        15,
        Math.round(session.durationMin * EASE_BACK_VOLUME_FRACTION)
      );
      if (newDuration !== session.durationMin) {
        updated = { ...updated, durationMin: newDuration };
        changes.push({
          sessionId: id,
          kind: "shortened",
          reasonCode: "EASE_BACK_VOLUME",
          params: { volumePct, durationMin: newDuration },
          source: "EASE",
        });
      }

      const hard =
        session.isHard ||
        isHardZone(session.maxZone) ||
        (session.targets.kind === "zone" && isHardZone(session.targets.zone));
      if (hard) {
        updated = {
          ...updated,
          isHard: false,
          maxZone: "Z2",
          targets:
            updated.targets.kind === "zone"
              ? { kind: "zone", zone: "Z2" }
              : updated.targets,
        };
        changes.push({
          sessionId: id,
          kind: "retargeted",
          reasonCode: "EASE_BACK_NO_Z4",
          params: {},
          source: "EASE",
        });
      }
      return updated;
    });
  }

  return { ok: true, value: next, changes };
}

export function shouldOfferEaseBackIn(missedDays: number): boolean {
  return missedDays >= EASE_BACK_MISSED_DAYS_THRESHOLD;
}
