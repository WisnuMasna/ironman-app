import {
  DisciplineStatus,
  FitnessTestKind,
  FitnessTestSource,
  type Athlete,
  type FitnessTest,
  type Race,
  type RaceResult,
} from "@prisma/client";
import { prisma } from "./prisma";

export type AthleteWithTraining = Athlete & {
  raceResults: RaceResult[];
  fitnessTests: FitnessTest[];
  races: Race[];
};

export async function getAthlete(): Promise<AthleteWithTraining | null> {
  return prisma.athlete.findFirst({
    include: {
      raceResults: { orderBy: { distanceM: "asc" } },
      fitnessTests: { orderBy: { date: "desc" } },
      races: true,
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
