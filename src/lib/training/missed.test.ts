import { describe, expect, it } from "vitest";
import {
  listValidMoveSlots,
  moveMissedSession,
  skipMissedSession,
} from "./missed";
import type { DayPlan, PlannedSession, WeekPlan } from "./sessions";

function session(
  partial: Partial<PlannedSession> & Pick<PlannedSession, "sport">
): PlannedSession {
  return {
    type: "easy",
    durationMin: 45,
    isHard: false,
    maxZone: "Z2",
    targets: { kind: "skill", checkpointHint: "next", rpe: 4 },
    outdoor: false,
    ...partial,
  };
}

function weekFromDays(days: DayPlan[]): WeekPlan {
  return {
    weekStartMonday: "2027-03-15",
    phase: "Build",
    isRecoveryWeek: false,
    days,
  };
}

describe("missed.ts — skip / move (never stack)", () => {
  it("lists only empty days in the same week as move slots", () => {
    const week = weekFromDays([
      { date: "2027-03-15", dayOfWeek: 1, sessions: [] },
      {
        date: "2027-03-16",
        dayOfWeek: 2,
        sessions: [session({ sport: "swim", isHard: true, maxZone: "Z4" })],
      },
      {
        date: "2027-03-17",
        dayOfWeek: 3,
        sessions: [session({ sport: "run" })],
      },
      { date: "2027-03-18", dayOfWeek: 4, sessions: [] },
    ]);

    const slots = listValidMoveSlots(week, "2027-03-16");
    expect(slots).toEqual(["2027-03-15", "2027-03-18"]);
  });

  it("skips a missed session without stacking onto the next day", () => {
    const week = weekFromDays([
      {
        date: "2027-03-16",
        dayOfWeek: 2,
        sessions: [
          session({
            sport: "bike",
            type: "intervals",
            isHard: true,
            maxZone: "Z4",
            durationMin: 60,
          }),
        ],
      },
      {
        date: "2027-03-17",
        dayOfWeek: 3,
        sessions: [session({ sport: "swim" })],
      },
    ]);

    const result = skipMissedSession(week, { date: "2027-03-16", sport: "bike" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.days.find((d) => d.date === "2027-03-16")?.sessions).toEqual(
      []
    );
    expect(result.value.days.find((d) => d.date === "2027-03-17")?.sessions).toHaveLength(
      1
    );
    expect(
      result.value.days.find((d) => d.date === "2027-03-17")?.sessions[0]?.isHard
    ).toBe(false);
  });

  it("moves a missed session onto an empty day and never stacks onto a busy day", () => {
    const week = weekFromDays([
      {
        date: "2027-03-16",
        dayOfWeek: 2,
        sessions: [
          session({
            sport: "bike",
            type: "intervals",
            isHard: true,
            maxZone: "Z4",
            durationMin: 60,
          }),
        ],
      },
      {
        date: "2027-03-17",
        dayOfWeek: 3,
        sessions: [session({ sport: "swim" })],
      },
      { date: "2027-03-18", dayOfWeek: 4, sessions: [] },
    ]);

    const stacked = moveMissedSession(week, {
      fromDate: "2027-03-16",
      sport: "bike",
      toDate: "2027-03-17",
    });
    expect(stacked).toEqual({ ok: false, error: "slot-unavailable" });

    const moved = moveMissedSession(week, {
      fromDate: "2027-03-16",
      sport: "bike",
      toDate: "2027-03-18",
    });
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.value.days.find((d) => d.date === "2027-03-16")?.sessions).toEqual([]);
    const fri = moved.value.days.find((d) => d.date === "2027-03-18");
    expect(fri?.sessions).toHaveLength(1);
    expect(fri?.sessions[0]?.sport).toBe("bike");
    expect(fri?.sessions[0]?.isHard).toBe(true);
  });
});
