import { describe, expect, it } from "vitest";
import { reasonCodeToPlainNote, type PlanChange } from "./plan-change";
import {
  applyNewFitnessTest,
  handleMissedKeySession,
} from "./adapt";
import { moveMissedSession, skipMissedSession } from "./missed";
import { easeBackIn } from "./ease";
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

describe("plan changes always carry a reasonCode", () => {
  it("records drop + intensity swap when a key session is missed", () => {
    const week = weekFromDays([
      {
        date: "2027-03-17",
        dayOfWeek: 3,
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
        date: "2027-03-19",
        dayOfWeek: 5,
        sessions: [session({ sport: "run", isHard: false, maxZone: "Z2" })],
      },
    ]);

    const result = handleMissedKeySession(week, {
      date: "2027-03-17",
      sport: "bike",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.changes.length).toBeGreaterThan(0);
    expect(result.changes.every((c) => c.reasonCode.length > 0)).toBe(true);
    expect(result.changes.some((c) => c.reasonCode === "MISSED_KEY_DROPPED")).toBe(
      true
    );
    expect(
      result.changes.some((c) => c.reasonCode === "MISSED_KEY_INTENSITY_SWAPPED")
    ).toBe(true);
  });

  it("records skip and move reasons", () => {
    const week = weekFromDays([
      {
        date: "2027-03-16",
        dayOfWeek: 2,
        sessions: [session({ sport: "bike", isHard: true, maxZone: "Z4" })],
      },
      { date: "2027-03-18", dayOfWeek: 4, sessions: [] },
    ]);

    const skipped = skipMissedSession(week, { date: "2027-03-16", sport: "bike" });
    expect(skipped.ok).toBe(true);
    if (!skipped.ok) return;
    expect(skipped.changes[0]?.reasonCode).toBe("MISSED_SKIPPED");

    const moved = moveMissedSession(week, {
      fromDate: "2027-03-16",
      sport: "bike",
      toDate: "2027-03-18",
    });
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.changes[0]?.reasonCode).toBe("MISSED_MOVED");
  });

  it("records retarget changes after a new FTP", () => {
    const result = applyNewFitnessTest({
      datedSessions: [
        {
          date: "2027-03-20",
          session: session({
            sport: "bike",
            targets: { kind: "skill", checkpointHint: "B6", rpe: 4 },
          }),
        },
      ],
      testDate: "2027-03-15",
      kind: "FTP",
      value: 250,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.changes).toEqual([
      expect.objectContaining({
        kind: "retargeted",
        reasonCode: "NEW_FTP_RETARGET",
        source: "TEST",
      }),
    ]);
  });

  it("easeBackIn lowers volume, strips Z4+, and returns reasons", () => {
    const week = weekFromDays([
      {
        date: "2027-03-15",
        dayOfWeek: 1,
        sessions: [
          session({
            sport: "bike",
            durationMin: 100,
            isHard: true,
            maxZone: "Z4",
            targets: { kind: "zone", zone: "Z4" },
          }),
          session({
            sport: "run",
            durationMin: 60,
            targets: { kind: "zone", zone: "Z2" },
          }),
        ],
      },
    ]);

    const result = easeBackIn(week, 5, "2027-03-15");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const bike = result.value.days[0]?.sessions.find((s) => s.sport === "bike");
    const run = result.value.days[0]?.sessions.find((s) => s.sport === "run");
    expect(bike?.isHard).toBe(false);
    expect(bike?.maxZone).toBe("Z2");
    expect(run?.durationMin).toBe(42); // 70% of 60
    expect(result.changes.some((c) => c.reasonCode === "EASE_BACK_VOLUME")).toBe(
      true
    );
    expect(result.changes.some((c) => c.reasonCode === "EASE_BACK_NO_Z4")).toBe(
      true
    );
  });

  it("maps reason codes to plain ChangeNote text", () => {
    const change: PlanChange = {
      sessionId: "2027-03-17:bike:0",
      kind: "dropped",
      reasonCode: "MISSED_KEY_DROPPED",
      params: {},
      source: "MISSED",
    };
    expect(reasonCodeToPlainNote(change)).toMatch(/never stacked/i);
  });
});
