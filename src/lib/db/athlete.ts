import {
  DisciplineStatus,
  FitnessTestKind,
  FitnessTestSource,
  Sport,
  WorkoutStatus,
  type Athlete,
  type FitnessTest,
  type Race,
  type RaceResult,
  type SkillCheckpoint,
  type WorkoutLog,
} from "@prisma/client";
import { prisma } from "./prisma";
import type { PlannedSession } from "../training/sessions";
import type { BikeCheckpointCode, SwimCheckpointCode } from "../training/skills";

export type AthleteWithTraining = Athlete & {
  raceResults: RaceResult[];
  fitnessTests: FitnessTest[];
  races: Race[];
  skillCheckpoints: SkillCheckpoint[];
  workoutLogs: WorkoutLog[];
};

export async function getAthlete(): Promise<AthleteWithTraining | null> {
  return prisma.athlete.findFirst({
    include: {
      raceResults: { orderBy: { distanceM: "asc" } },
      fitnessTests: { orderBy: { date: "desc" } },
      races: true,
      skillCheckpoints: { orderBy: { code: "asc" } },
      workoutLogs: { orderBy: { date: "asc" } },
    },
  });
}

export async function updateEquipment(
  athleteId: number,
  equipment: {
    hasBike: boolean;
    bikeFitDone: boolean;
    hasIndoorTrainer: boolean;
    hasClipless: boolean;
  }
): Promise<void> {
  await prisma.athlete.update({
    where: { id: athleteId },
    data: equipment,
  });
}

export async function recordFtpTest(
  athleteId: number,
  ftpWatts: number,
  today: string
): Promise<void> {
  await prisma.fitnessTest.create({
    data: {
      athleteId,
      date: today,
      kind: FitnessTestKind.FTP,
      value: ftpWatts,
      estimated: false,
      source: FitnessTestSource.FIELD_TEST,
    },
  });
  await prisma.athlete.update({
    where: { id: athleteId },
    data: { bikeStatus: DisciplineStatus.ZONES },
  });
}

export function latestTestValue(
  tests: FitnessTest[],
  kind: FitnessTestKind
): FitnessTest | null {
  return tests.find((t) => t.kind === kind) ?? null;
}

const SPORT_MAP: Record<PlannedSession["sport"], Sport> = {
  swim: Sport.SWIM,
  bike: Sport.BIKE,
  run: Sport.RUN,
  brick: Sport.BRICK,
  strength: Sport.STRENGTH,
};

export function toPrismaSport(sport: PlannedSession["sport"]): Sport {
  return SPORT_MAP[sport];
}

export async function logWorkout(input: {
  athleteId: number;
  date: string;
  sport: PlannedSession["sport"];
  durationMin: number;
  status: WorkoutStatus;
  rpe: number | null;
  notes: string | null;
  movedToDate?: string | null;
}): Promise<void> {
  const existing = await prisma.workoutLog.findFirst({
    where: {
      athleteId: input.athleteId,
      date: input.date,
      sport: toPrismaSport(input.sport),
    },
  });
  const data = {
    durationMin: input.durationMin,
    status: input.status,
    rpe: input.rpe,
    notes: input.notes,
    movedToDate: input.movedToDate ?? null,
  };
  if (existing !== null) {
    await prisma.workoutLog.update({ where: { id: existing.id }, data });
    return;
  }
  await prisma.workoutLog.create({
    data: {
      athleteId: input.athleteId,
      date: input.date,
      sport: toPrismaSport(input.sport),
      ...data,
    },
  });
}

export async function saveSkillTracks(
  athleteId: number,
  checkpoints: Array<{
    code: string;
    sport: "SWIM" | "BIKE";
    description: string;
    targetDate: string;
    doneDate: string | null;
  }>
): Promise<void> {
  for (const checkpoint of checkpoints) {
    await prisma.skillCheckpoint.upsert({
      where: {
        athleteId_code: { athleteId, code: checkpoint.code },
      },
      update: {
        targetDate: checkpoint.targetDate,
        doneDate: checkpoint.doneDate,
        description: checkpoint.description,
      },
      create: {
        athleteId,
        code: checkpoint.code,
        sport: checkpoint.sport,
        description: checkpoint.description,
        targetDate: checkpoint.targetDate,
        doneDate: checkpoint.doneDate,
      },
    });
  }
}

export type CheckpointCode = SwimCheckpointCode | BikeCheckpointCode;
