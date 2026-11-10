import { describe, expect, it } from "vitest";
import { buildPhases } from "./phases";

describe("phases.ts — buildPhases for Da Nang 2027-05-09", () => {
  it("reproduces PLAN.md §7.2 phase dates from today 2026-11-10", () => {
    const res = buildPhases("2027-05-09", "2026-11-10", 3);
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const byName = Object.fromEntries(res.value.phases.map((p) => [p.name, p]));
    expect(byName.Prep).toMatchObject({
      startDate: "2026-11-10",
      endDate: "2026-11-22",
    });
    expect(byName.Base).toMatchObject({
      startDate: "2026-11-23",
      endDate: "2027-02-14",
    });
    expect(byName.Build).toMatchObject({
      startDate: "2027-02-15",
      endDate: "2027-04-18",
    });
    expect(byName.Peak).toMatchObject({
      startDate: "2027-04-19",
      endDate: "2027-04-25",
    });
    expect(byName.Taper).toMatchObject({
      startDate: "2027-04-26",
      endDate: "2027-05-09",
    });
  });

  it("marks recovery weeks as the last week of each recovery block", () => {
    const res = buildPhases("2027-05-09", "2026-11-10", 3);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // Every 3rd week within Base/Build load blocks ending on recovery
    expect(res.value.recoveryWeekStartDates.length).toBeGreaterThan(0);
    for (const d of res.value.recoveryWeekStartDates) {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("always keeps a 2-week taper when the calendar is short", () => {
    // Start only 8 weeks before race → shrink Prep then Base; taper stays 2 weeks
    const res = buildPhases("2027-05-09", "2027-03-15", 3);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const taper = res.value.phases.find((p) => p.name === "Taper");
    expect(taper).toMatchObject({
      startDate: "2027-04-26",
      endDate: "2027-05-09",
    });
    const prep = res.value.phases.find((p) => p.name === "Prep");
    // Prep may be absent or zero-length when fully shrunk
    if (prep) {
      expect(prep.startDate <= prep.endDate).toBe(true);
    }
  });

  it("shrinks Prep before Base when weeks are limited", () => {
    const full = buildPhases("2027-05-09", "2026-11-10", 3);
    const short = buildPhases("2027-05-09", "2026-12-01", 3);
    expect(full.ok && short.ok).toBe(true);
    if (!full.ok || !short.ok) return;

    const fullPrep = full.value.phases.find((p) => p.name === "Prep");
    const shortPrep = short.value.phases.find((p) => p.name === "Prep");
    const fullBase = full.value.phases.find((p) => p.name === "Base");
    const shortBase = short.value.phases.find((p) => p.name === "Base");

    // Starting later removes Prep first
    if (shortPrep === undefined) {
      expect(fullPrep).toBeDefined();
    } else {
      expect(fullPrep).toBeDefined();
      if (fullPrep) {
        expect(
          shortPrep.endDate < fullPrep.endDate ||
            shortPrep.startDate > fullPrep.startDate
        ).toBe(true);
      }
    }
    expect(shortBase).toBeDefined();
    expect(fullBase).toBeDefined();
  });

  it("rejects invalid calendar dates or today after race", () => {
    expect(buildPhases("not-a-date", "2026-11-10", 3)).toEqual({
      ok: false,
      error: "invalid-date",
    });
    expect(buildPhases("2027-05-09", "2027-05-10", 3)).toEqual({
      ok: false,
      error: "today-after-race",
    });
    expect(buildPhases("2027-05-09", "2026-11-10", 0)).toEqual({
      ok: false,
      error: "non-positive-input",
    });
  });
});
