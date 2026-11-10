import { describe, expect, it } from "vitest";
import { buildPhases } from "./phases";
import { generateWeekSessions } from "./sessions";

const ATHLETE = {
  weeklyHoursAvailable: 10,
  restDays: [1] as number[], // Monday = 1 … Sunday = 7
  longDay: 7 as number, // Sunday
  recoveryBlockWeeks: 3,
  disciplineStatus: {
    swim: "skill" as const,
    bike: "skill" as const,
    run: "zones" as const,
  },
  hasBike: false,
  runSessionsCap: 3,
};

function weeksBetween(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const [ys, ms, ds] = startIso.split("-").map(Number);
  const [ye, me, de] = endIso.split("-").map(Number);
  const cursor = new Date(ys, ms - 1, ds);
  const end = new Date(ye, me - 1, de);
  // Align to Monday
  const day = cursor.getDay();
  const offset = day === 0 ? 6 : day - 1;
  cursor.setDate(cursor.getDate() - offset);
  while (cursor <= end) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 7);
  }
  return out;
}

describe("sessions.ts — weekly generator invariants", () => {
  it("keeps rest days empty and hard sessions within the Seiler limit", () => {
    const phases = buildPhases("2027-05-09", "2026-11-10", 3);
    expect(phases.ok).toBe(true);
    if (!phases.ok) return;

    const weekStarts = weeksBetween("2026-11-10", "2027-05-09");
    for (const weekStart of weekStarts) {
      const week = generateWeekSessions({
        weekStartMonday: weekStart,
        raceDate: "2027-05-09",
        today: "2026-11-10",
        athlete: ATHLETE,
        phasePlan: phases.value,
      });
      expect(week.ok).toBe(true);
      if (!week.ok) continue;

      for (const day of week.value.days) {
        if (ATHLETE.restDays.includes(day.dayOfWeek)) {
          expect(day.sessions).toEqual([]);
        }
        expect(day.sessions.length).toBeLessThanOrEqual(2);
      }

      const hardCount = week.value.days
        .flatMap((d) => d.sessions)
        .filter((s) => s.isHard).length;
      expect(hardCount).toBeLessThanOrEqual(2);
    }
  });

  it("uses zone targets for bike when discipline status is zones", () => {
    const phases = buildPhases("2027-05-09", "2026-11-10", 3);
    expect(phases.ok).toBe(true);
    if (!phases.ok) return;

    const week = generateWeekSessions({
      weekStartMonday: "2026-12-07",
      raceDate: "2027-05-09",
      today: "2026-11-10",
      athlete: {
        ...ATHLETE,
        hasBike: true,
        disciplineStatus: { ...ATHLETE.disciplineStatus, bike: "zones" },
      },
      phasePlan: phases.value,
    });
    expect(week.ok).toBe(true);
    if (!week.ok) return;

    const bikes = week.value.days
      .flatMap((d) => d.sessions)
      .filter((s) => s.sport === "bike");
    expect(bikes.length).toBeGreaterThan(0);
    for (const s of bikes) {
      expect(s.targets.kind).toBe("zone");
      expect(s.outdoor).toBe(true);
    }
  });

  it("marks bike sessions outdoor when hasBike is true", () => {
    const phases = buildPhases("2027-05-09", "2026-11-10", 3);
    expect(phases.ok).toBe(true);
    if (!phases.ok) return;

    const week = generateWeekSessions({
      weekStartMonday: "2026-12-07",
      raceDate: "2027-05-09",
      today: "2026-11-10",
      athlete: { ...ATHLETE, hasBike: true },
      phasePlan: phases.value,
    });
    expect(week.ok).toBe(true);
    if (!week.ok) return;

    const bikes = week.value.days
      .flatMap((d) => d.sessions)
      .filter((s) => s.sport === "bike");
    expect(bikes.length).toBeGreaterThan(0);
    for (const s of bikes) {
      expect(s.outdoor).toBe(true);
      expect(s.type).toBe("outdoor-allowed");
    }
  });

  it("uses skill targets (not zones) for skill disciplines; never outdoor bike without a bike", () => {
    const phases = buildPhases("2027-05-09", "2026-11-10", 3);
    expect(phases.ok).toBe(true);
    if (!phases.ok) return;

    const week = generateWeekSessions({
      weekStartMonday: "2026-12-07",
      raceDate: "2027-05-09",
      today: "2026-11-10",
      athlete: ATHLETE,
      phasePlan: phases.value,
    });
    expect(week.ok).toBe(true);
    if (!week.ok) return;

    const sessions = week.value.days.flatMap((d) => d.sessions);
    for (const s of sessions) {
      if (s.sport === "swim" || s.sport === "bike") {
        expect(s.targets.kind).toBe("skill");
        expect("zone" in s.targets).toBe(false);
      }
      if (s.sport === "run") {
        expect(s.targets.kind).toBe("zone");
      }
      if (s.sport === "bike") {
        expect(s.outdoor).toBe(false);
        expect(s.type === "indoor-bridge" || s.type === "indoor").toBe(true);
      }
    }
  });

  it("has no Z4+ work in recovery weeks or Base early weeks", () => {
    const phases = buildPhases("2027-05-09", "2026-11-10", 3);
    expect(phases.ok).toBe(true);
    if (!phases.ok) return;

    for (const weekStart of phases.value.recoveryWeekStartDates) {
      const week = generateWeekSessions({
        weekStartMonday: weekStart,
        raceDate: "2027-05-09",
        today: "2026-11-10",
        athlete: ATHLETE,
        phasePlan: phases.value,
      });
      expect(week.ok).toBe(true);
      if (!week.ok) continue;
      const hardOrZ4 = week.value.days
        .flatMap((d) => d.sessions)
        .filter((s) => s.isHard || s.maxZone === "Z4" || s.maxZone === "Z5" || s.maxZone === "Z5a");
      expect(hardOrZ4).toEqual([]);
    }

    // First Base week should also avoid Z4+
    const base = phases.value.phases.find((p) => p.name === "Base");
    expect(base).toBeDefined();
    if (!base) return;
    const baseWeek = generateWeekSessions({
      weekStartMonday: "2026-11-23",
      raceDate: "2027-05-09",
      today: "2026-11-10",
      athlete: ATHLETE,
      phasePlan: phases.value,
    });
    expect(baseWeek.ok).toBe(true);
    if (!baseWeek.ok) return;
    for (const s of baseWeek.value.days.flatMap((d) => d.sessions)) {
      expect(["Z4", "Z5", "Z5a", "Z5b", "Z5c"].includes(s.maxZone ?? "")).toBe(
        false
      );
    }
  });

  it("caps run sessions and keeps swim frequency ≥ other sports in Base", () => {
    const phases = buildPhases("2027-05-09", "2026-11-10", 3);
    expect(phases.ok).toBe(true);
    if (!phases.ok) return;

    const week = generateWeekSessions({
      weekStartMonday: "2026-12-07",
      raceDate: "2027-05-09",
      today: "2026-11-10",
      athlete: ATHLETE,
      phasePlan: phases.value,
    });
    expect(week.ok).toBe(true);
    if (!week.ok) return;

    const sessions = week.value.days.flatMap((d) => d.sessions);
    const runCount = sessions.filter((s) => s.sport === "run").length;
    const swimCount = sessions.filter((s) => s.sport === "swim").length;
    const bikeCount = sessions.filter((s) => s.sport === "bike").length;
    expect(runCount).toBeLessThanOrEqual(ATHLETE.runSessionsCap);
    expect(swimCount).toBeGreaterThanOrEqual(bikeCount);
    expect(swimCount).toBeGreaterThanOrEqual(runCount);
  });

  it("cuts taper volume 41–60% vs Build while keeping session frequency", () => {
    const phases = buildPhases("2027-05-09", "2026-11-10", 3);
    expect(phases.ok).toBe(true);
    if (!phases.ok) return;

    const buildWeek = generateWeekSessions({
      weekStartMonday: "2027-03-15",
      raceDate: "2027-05-09",
      today: "2026-11-10",
      athlete: ATHLETE,
      phasePlan: phases.value,
    });
    const taperWeek = generateWeekSessions({
      weekStartMonday: "2027-04-26",
      raceDate: "2027-05-09",
      today: "2026-11-10",
      athlete: ATHLETE,
      phasePlan: phases.value,
    });
    expect(buildWeek.ok && taperWeek.ok).toBe(true);
    if (!buildWeek.ok || !taperWeek.ok) return;

    const buildMinutes = buildWeek.value.days
      .flatMap((d) => d.sessions)
      .reduce((sum, s) => sum + s.durationMin, 0);
    const taperMinutes = taperWeek.value.days
      .flatMap((d) => d.sessions)
      .reduce((sum, s) => sum + s.durationMin, 0);
    const buildCount = buildWeek.value.days.flatMap((d) => d.sessions).length;
    const taperCount = taperWeek.value.days.flatMap((d) => d.sessions).length;

    const reduction = 1 - taperMinutes / buildMinutes;
    expect(reduction).toBeGreaterThanOrEqual(0.41);
    expect(reduction).toBeLessThanOrEqual(0.6);
    expect(taperCount).toBe(buildCount);
  });
});
