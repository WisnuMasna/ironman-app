import { describe, expect, it } from "vitest";
import {
  applyNewFitnessTest,
  computeWeekCompliance,
  handleMissedKeySession,
  replanOverdueCheckpoints,
  shouldRepeatNextLoadWeek,
} from "./adapt";
import { buildSkillTracks } from "./skills";
import type { DayPlan, PlannedSession, WeekPlan } from "./sessions";

function session(partial: Partial<PlannedSession> & Pick<PlannedSession, "sport">): PlannedSession {
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

describe("adapt.ts — missed key session is not stacked", () => {
  it("drops a missed key session instead of adding it to the next day", () => {
    const wednesdayKey = session({
      sport: "bike",
      type: "intervals",
      isHard: true,
      maxZone: "Z4",
      durationMin: 60,
    });
    const thursdayEasy = session({ sport: "swim", durationMin: 45 });
    const week = weekFromDays([
      { date: "2027-03-15", dayOfWeek: 1, sessions: [] },
      { date: "2027-03-16", dayOfWeek: 2, sessions: [session({ sport: "swim" })] },
      { date: "2027-03-17", dayOfWeek: 3, sessions: [wednesdayKey] },
      { date: "2027-03-18", dayOfWeek: 4, sessions: [thursdayEasy] },
      {
        date: "2027-03-19",
        dayOfWeek: 5,
        sessions: [session({ sport: "run", isHard: false })],
      },
    ]);

    const result = handleMissedKeySession(week, {
      date: "2027-03-17",
      sport: "bike",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const wed = result.value.days.find((d) => d.date === "2027-03-17");
    const thu = result.value.days.find((d) => d.date === "2027-03-18");
    expect(wed?.sessions).toEqual([]);
    // Not stacked onto Thursday: still one session, not two
    expect(thu?.sessions).toHaveLength(1);
    expect(thu?.sessions[0]?.sport).toBe("swim");
  });

  it("swaps the missed key work onto a later easy session in the same week", () => {
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

    const later = result.value.days.find((d) => d.date === "2027-03-19");
    expect(later?.sessions[0]?.isHard).toBe(true);
    expect(later?.sessions[0]?.maxZone).toBe("Z4");
  });
});

describe("adapt.ts — weekly compliance repeats the next load week", () => {
  it("repeats when compliance is below the 70% project default", () => {
    expect(computeWeekCompliance({ planned: 7, done: 2, partial: 0 })).toBeCloseTo(
      2 / 7,
      5
    );
    expect(shouldRepeatNextLoadWeek(2 / 7)).toBe(true);
    expect(shouldRepeatNextLoadWeek(0.69)).toBe(true);
  });

  it("does not repeat when compliance meets the threshold", () => {
    expect(shouldRepeatNextLoadWeek(0.7)).toBe(false);
    expect(shouldRepeatNextLoadWeek(1)).toBe(false);
    expect(computeWeekCompliance({ planned: 6, done: 4, partial: 2 })).toBeCloseTo(
      (4 + 2 * 0.5) / 6,
      5
    );
  });
});

describe("adapt.ts — new FTP changes future targets only", () => {
  it("converts future bike skill sessions to zone targets after an FTP test", () => {
    const past = {
      date: "2027-02-01",
      session: session({ sport: "bike", targets: { kind: "skill", checkpointHint: "B5", rpe: 4 } }),
    };
    const future = {
      date: "2027-03-20",
      session: session({ sport: "bike", targets: { kind: "skill", checkpointHint: "B6", rpe: 4 } }),
    };
    const futureRun = {
      date: "2027-03-20",
      session: session({
        sport: "run",
        targets: { kind: "zone", zone: "Z2" },
      }),
    };

    const result = applyNewFitnessTest({
      datedSessions: [past, future, futureRun],
      testDate: "2027-03-15",
      kind: "FTP",
      value: 250,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value[0]?.session.targets).toEqual({
      kind: "skill",
      checkpointHint: "B5",
      rpe: 4,
    });
    expect(result.value[1]?.session.targets).toEqual({ kind: "zone", zone: "Z2" });
    expect(result.value[2]?.session.targets).toEqual({ kind: "zone", zone: "Z2" });
  });

  it("rejects a non-positive FTP", () => {
    expect(
      applyNewFitnessTest({
        datedSessions: [],
        testDate: "2027-03-15",
        kind: "FTP",
        value: 0,
      })
    ).toEqual({ ok: false, error: "non-positive-input" });
  });
});

describe("adapt.ts — missed checkpoint date re-plans later targets", () => {
  it("slips later swim checkpoints and warns if S6 lands after Peak", () => {
    const tracks = buildSkillTracks({
      today: "2026-11-10",
      prepEndDate: "2026-11-22",
      peakStartDate: "2027-04-19",
      buildStartDate: "2027-02-15",
    });
    const result = replanOverdueCheckpoints(tracks, "2027-04-01", "2027-04-19");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const s4 = result.value.swim.find((c) => c.code === "S4");
    const s5 = result.value.swim.find((c) => c.code === "S5");
    const s6 = result.value.swim.find((c) => c.code === "S6");
    expect(s4?.targetDate).toBe("2027-04-01");
    expect(s5?.targetDate && s5.targetDate > "2027-03-31").toBe(true);
    expect(s6?.targetDate && s6.targetDate > "2027-04-19").toBe(true);
    expect(result.value.warning).toBe("checkpoint-past-peak");
  });

  it("does not slip checkpoints that are already done or still in the future", () => {
    const tracks = buildSkillTracks({
      today: "2026-11-10",
      prepEndDate: "2026-11-22",
      peakStartDate: "2027-04-19",
      buildStartDate: "2027-02-15",
    });
    const s0 = tracks.swim.find((c) => c.code === "S0");
    if (s0) s0.doneDate = "2026-11-20";

    const result = replanOverdueCheckpoints(tracks, "2026-11-25", "2027-04-19");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.swim.find((c) => c.code === "S0")?.targetDate).toBe(
      "2026-11-22"
    );
    expect(result.value.swim.find((c) => c.code === "S3")?.targetDate).toBe(
      "2027-01-15"
    );
    expect(result.value.warning).toBeNull();
  });
});
