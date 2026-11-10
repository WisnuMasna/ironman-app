import { describe, expect, it } from "vitest";
import { buildIcsCalendar } from "./ics";
import type { PlannedSession } from "./sessions";

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

describe("ics.ts — calendar export", () => {
  it("emits one VEVENT per session with targets in the description", () => {
    const ics = buildIcsCalendar({
      calendarName: "IM 70.3 training",
      timezone: "Asia/Ho_Chi_Minh",
      events: [
        {
          date: "2027-03-16",
          startHourLocal: 6,
          session: session({
            sport: "bike",
            durationMin: 60,
            targets: { kind: "zone", zone: "Z2" },
          }),
        },
        {
          date: "2027-03-17",
          startHourLocal: 7,
          session: session({
            sport: "swim",
            durationMin: 45,
            targets: { kind: "skill", checkpointHint: "S1", rpe: 4 },
          }),
        },
      ],
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(2);
    expect(ics).toContain("SUMMARY:bike · easy · Z2");
    expect(ics).toContain("DESCRIPTION:zone Z2 · 60 min");
    expect(ics).toContain("SUMMARY:swim · easy · skill");
    expect(ics).toContain("END:VCALENDAR");
  });
});
