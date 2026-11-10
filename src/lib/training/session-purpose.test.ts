import { describe, expect, it } from "vitest";
import type { PlannedSession } from "./sessions";
import { buildSessionPurpose, sessionTitle } from "./session-purpose";

function session(
  partial: Partial<PlannedSession> & Pick<PlannedSession, "sport">
): PlannedSession {
  return {
    type: "easy",
    durationMin: 40,
    isHard: false,
    maxZone: "Z2",
    targets: { kind: "zone", zone: "Z2" },
    outdoor: false,
    ...partial,
  };
}

describe("session-purpose", () => {
  it("titles skill swim as a lesson and explains the checkpoint", () => {
    const purpose = buildSessionPurpose({
      session: session({
        sport: "swim",
        type: "skill",
        durationMin: 45,
        maxZone: null,
        targets: { kind: "skill", checkpointHint: "S0", rpe: 4 },
      }),
      athleteFirstName: "Wisnu",
      phase: "Prep",
    });
    expect(purpose.title).toBe("Swim lesson");
    expect(purpose.why[0]).toMatch(/Wisnu/);
    expect(purpose.why.join(" ")).toMatch(/skill|comfort|water/i);
    expect(purpose.steps.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps easy runs conversational and recovery-focused", () => {
    const purpose = buildSessionPurpose({
      session: session({ sport: "run", type: "easy", durationMin: 40 }),
      athleteFirstName: "Wisnu",
      phase: "Base",
    });
    expect(purpose.title).toBe("Easy run");
    expect(sessionTitle(session({ sport: "run", type: "easy" }))).toBe(
      "Easy run"
    );
    expect(purpose.effortCue).toMatch(/chat|easy|conversational/i);
    expect(purpose.why.join(" ")).toMatch(/easy|recover|aerobic/i);
  });

  it("explains outdoor bike practice vs indoor bridge", () => {
    const outdoor = buildSessionPurpose({
      session: session({
        sport: "bike",
        type: "endurance",
        durationMin: 60,
        outdoor: true,
      }),
      athleteFirstName: "Wisnu",
      phase: "Prep",
    });
    expect(outdoor.title).toBe("Outdoor ride");
    expect(outdoor.why.join(" ")).toMatch(/bike|road|handle/i);

    const indoor = buildSessionPurpose({
      session: session({
        sport: "bike",
        type: "spin",
        durationMin: 45,
        outdoor: false,
      }),
      athleteFirstName: "Wisnu",
      phase: "Prep",
    });
    expect(indoor.title).toBe("Spin bridge");
    expect(indoor.why.join(" ")).toMatch(/indoor|bridge|fit/i);
  });
});
