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
