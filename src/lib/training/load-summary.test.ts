import { describe, expect, it } from "vitest";
import { summarizeWeekLoad } from "./load-summary";
import type { DayPlan, PlannedSession, WeekPlan } from "./sessions";

function session(
  partial: Partial<PlannedSession> & Pick<PlannedSession, "sport">
): PlannedSession {
  return {
    type: "easy",
    durationMin: 45,
    isHard: false,
    maxZone: "Z2",
    targets: { kind: "zone", zone: "Z2" },
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

describe("load-summary.ts — planned vs done", () => {
  it("summarises hours and sessions per sport and flags a Z3/Z4 black hole", () => {
    const week = weekFromDays([
      {
        date: "2027-03-15",
        dayOfWeek: 1,
        sessions: [
          session({ sport: "swim", durationMin: 60 }),
          session({
            sport: "bike",
            durationMin: 90,
            isHard: true,
            maxZone: "Z4",
            targets: { kind: "zone", zone: "Z4" },
          }),
        ],
      },
      {
        date: "2027-03-16",
        dayOfWeek: 2,
        sessions: [
          session({
            sport: "run",
            durationMin: 45,
            targets: { kind: "zone", zone: "Z3" },
          }),
        ],
      },
    ]);

    const summary = summarizeWeekLoad({
      week,
      logs: [
        { date: "2027-03-15", sport: "swim", durationMin: 55, status: "DONE" },
        { date: "2027-03-15", sport: "bike", durationMin: 90, status: "DONE" },
        { date: "2027-03-16", sport: "run", durationMin: 30, status: "PARTIAL" },
      ],
    });

    expect(summary.plannedSessions).toBe(3);
    expect(summary.doneSessions).toBe(2);
    expect(summary.partialSessions).toBe(1);
    expect(summary.plannedHours).toBeCloseTo(3.25, 5);
    expect(summary.doneHours).toBeCloseTo(2.9166, 3);
    expect(summary.hardSessionCount).toBe(1);
    expect(summary.bySport.swim).toEqual({
      plannedSessions: 1,
      doneSessions: 1,
      plannedMin: 60,
      doneMin: 55,
    });
    expect(summary.thresholdBlackHole).toBe(true);
  });
});
