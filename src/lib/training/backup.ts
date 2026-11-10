import type { PlannedSession } from "./sessions";

export type BackupAthlete = {
  name: string;
  bodyMassKg: number | null;
  sweatRateLPerH: number | null;
  hasBike: boolean;
  bikeFitDone: boolean;
  hasIndoorTrainer: boolean;
  hasClipless: boolean;
  swimStatus: string;
  bikeStatus: string;
  runStatus: string;
};

export type BackupLog = {
  date: string;
  sport: string;
  durationMin: number;
  status: string;
  rpe: number | null;
  notes: string | null;
  movedToDate: string | null;
};

export type BackupCheckpoint = {
  code: string;
  sport: string;
  description: string;
  targetDate: string;
  doneDate: string | null;
};

export type BackupPayload = {
  exportedAt: string;
  athlete: BackupAthlete;
  checkpoints: BackupCheckpoint[];
  workoutLogs: BackupLog[];
  fitnessTests: Array<{ date: string; kind: string; value: number; estimated: boolean }>;
};

/**
 * Serialize athlete data for JSON backup download.
 * SOURCE: PLAN.md §6.2 data export / backup
 */
export function buildBackupPayload(input: {
  exportedAt: string;
  athlete: BackupAthlete;
  checkpoints: BackupCheckpoint[];
  workoutLogs: BackupLog[];
  fitnessTests: Array<{ date: string; kind: string; value: number; estimated: boolean }>;
}): BackupPayload {
  return {
    exportedAt: input.exportedAt,
    athlete: input.athlete,
    checkpoints: input.checkpoints,
    workoutLogs: input.workoutLogs,
    fitnessTests: input.fitnessTests,
  };
}

/**
 * CSV of workout logs (header + rows).
 * SOURCE: PLAN.md §6.2 CSV of logs
 */
export function workoutLogsToCsv(logs: BackupLog[]): string {
  const header = "date,sport,durationMin,status,rpe,movedToDate,notes";
  const rows = logs.map((log) =>
    [
      log.date,
      log.sport,
      String(log.durationMin),
      log.status,
      log.rpe === null ? "" : String(log.rpe),
      log.movedToDate ?? "",
      csvEscape(log.notes ?? ""),
    ].join(",")
  );
  return [header, ...rows].join("\n") + "\n";
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export type SessionSport = PlannedSession["sport"];

export type BackupValidation =
  | { ok: true; value: BackupPayload }
  | { ok: false; error: "invalid-json" | "missing-fields" };

export type BackupDiff = {
  athleteNameChanged: boolean;
  checkpointsAdded: number;
  checkpointsUpdated: number;
  logsAdded: number;
  logsUpdated: number;
  fitnessTestsAdded: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

/**
 * Validate a JSON backup before import.
 * SOURCE: PLAN.md §6.2 / M24 dry-run import
 */
export function validateBackupJson(raw: string): BackupValidation {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "invalid-json" };
  }
  if (!isRecord(parsed)) return { ok: false, error: "missing-fields" };
  if (!isRecord(parsed.athlete) || typeof parsed.athlete.name !== "string") {
    return { ok: false, error: "missing-fields" };
  }
  if (!Array.isArray(parsed.checkpoints) || !Array.isArray(parsed.workoutLogs)) {
    return { ok: false, error: "missing-fields" };
  }
  if (!Array.isArray(parsed.fitnessTests)) {
    return { ok: false, error: "missing-fields" };
  }
  return { ok: true, value: parsed as BackupPayload };
}

/**
 * Diff an incoming backup against the current store without writing.
 * SOURCE: PLAN.md M24 dry-run diff
 */
export function dryRunBackupDiff(
  current: BackupPayload,
  incoming: BackupPayload
): BackupDiff {
  const currentCodes = new Map(
    current.checkpoints.map((c) => [c.code, c] as const)
  );
  let checkpointsAdded = 0;
  let checkpointsUpdated = 0;
  for (const checkpoint of incoming.checkpoints) {
    const existing = currentCodes.get(checkpoint.code);
    if (existing === undefined) {
      checkpointsAdded += 1;
    } else if (
      existing.targetDate !== checkpoint.targetDate ||
      existing.doneDate !== checkpoint.doneDate
    ) {
      checkpointsUpdated += 1;
    }
  }

  const currentLogKeys = new Map<string, BackupLog>(
    current.workoutLogs.map((l) => [`${l.date}|${l.sport}`, l])
  );
  let logsAdded = 0;
  let logsUpdated = 0;
  for (const log of incoming.workoutLogs) {
    const key = `${log.date}|${log.sport}`;
    const existing = currentLogKeys.get(key);
    if (existing === undefined) {
      logsAdded += 1;
    } else if (
      existing.status !== log.status ||
      existing.durationMin !== log.durationMin
    ) {
      logsUpdated += 1;
    }
  }

  const currentTestKeys = new Set(
    current.fitnessTests.map((t) => `${t.date}|${t.kind}|${t.value}`)
  );
  const fitnessTestsAdded = incoming.fitnessTests.filter(
    (t) => !currentTestKeys.has(`${t.date}|${t.kind}|${t.value}`)
  ).length;

  return {
    athleteNameChanged: current.athlete.name !== incoming.athlete.name,
    checkpointsAdded,
    checkpointsUpdated,
    logsAdded,
    logsUpdated,
    fitnessTestsAdded,
  };
}
