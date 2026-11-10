import { describe, expect, it } from "vitest";
import {
  buildBackupPayload,
  dryRunBackupDiff,
  validateBackupJson,
} from "./backup";

const sample = buildBackupPayload({
  exportedAt: "2026-11-10T00:00:00.000Z",
  athlete: {
    name: "Wisnu",
    bodyMassKg: null,
    sweatRateLPerH: null,
    hasBike: false,
    bikeFitDone: false,
    hasIndoorTrainer: false,
    hasClipless: false,
    swimStatus: "SKILL",
    bikeStatus: "SKILL",
    runStatus: "ZONES",
  },
  checkpoints: [
    {
      code: "S0",
      sport: "SWIM",
      description: "lessons",
      targetDate: "2026-11-22",
      doneDate: null,
    },
  ],
  workoutLogs: [
    {
      date: "2026-11-10",
      sport: "SWIM",
      durationMin: 45,
      status: "DONE",
      rpe: 4,
      notes: null,
      movedToDate: null,
    },
  ],
  fitnessTests: [],
});

describe("backup import validation + dry-run", () => {
  it("rejects invalid JSON and missing fields", () => {
    expect(validateBackupJson("{").ok).toBe(false);
    expect(validateBackupJson("{}").ok).toBe(false);
  });

  it("accepts a valid payload and diffs against current", () => {
    const raw = JSON.stringify(sample);
    const validated = validateBackupJson(raw);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;

    const incoming = {
      ...sample,
      athlete: { ...sample.athlete, name: "Wisnu M" },
      workoutLogs: [
        ...sample.workoutLogs,
        {
          date: "2026-11-11",
          sport: "RUN",
          durationMin: 40,
          status: "DONE",
          rpe: 5,
          notes: null,
          movedToDate: null,
        },
      ],
      fitnessTests: [
        { date: "2026-11-10", kind: "FTP", value: 250, estimated: false },
      ],
    };

    const diff = dryRunBackupDiff(sample, incoming);
    expect(diff.athleteNameChanged).toBe(true);
    expect(diff.logsAdded).toBe(1);
    expect(diff.fitnessTestsAdded).toBe(1);
    expect(diff.checkpointsAdded).toBe(0);
  });
});
