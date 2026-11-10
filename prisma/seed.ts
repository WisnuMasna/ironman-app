import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DisciplineStatus,
  FitnessTestKind,
  FitnessTestSource,
  GoalTier,
  PrismaClient,
} from "@prisma/client";
import { buildSkillTracks } from "../src/lib/training/skills";

const prisma = new PrismaClient();

type SeedProfile = {
  athlete: {
    name: string;
    bodyMassKg: number | null;
    sweatRateLPerH: number | null;
    weeklyHoursAvailable: number | null;
    restDays: number[] | null;
    longDay: number | null;
    recoveryBlockWeeks: number;
  };
  race: {
    name: string;
    date: string;
    startTimeLocal: string;
    swimM: number;
    bikeKm: number;
    runKm: number;
    aidStationsBikeKm: number[];
    aidStationsRunSpacingKm: number[];
    cutoffs: {
      swimSec: number;
      swimT1BikeSec: number;
      totalSec: number;
    };
  };
  goal: {
    bufferSec: number;
    splitsSec: {
      swim: number;
      t1: number;
      bike: number;
      t2: number;
      run: number;
    };
    tiers: Array<{
      tier: string;
      finishUnderSec?: number;
    }>;
  };
  fitness: {
    thresholdRunPaceSecPerKm: number | null;
    thresholdRunPaceEstimate?: { estimated: boolean };
  };
  equipment: {
    hasBike: boolean;
    bikeFitDone: boolean;
    hasIndoorTrainer: boolean;
    hasClipless: boolean;
  };
  disciplineStatus: {
    swim: string;
    bike: string;
    run: string;
  };
  raceResults: Array<{
    distanceM: number;
    timeSec: number;
    label?: string;
    date: string | null;
    conditionsNote: string | null;
  }>;
};

function toDisciplineStatus(value: string): DisciplineStatus {
  return value.toUpperCase() === "ZONES"
    ? DisciplineStatus.ZONES
    : DisciplineStatus.SKILL;
}

function toGoalTier(value: string): GoalTier {
  if (value === "SUB_630") return GoalTier.SUB_630;
  if (value === "SUB_600") return GoalTier.SUB_600;
  return GoalTier.CUTOFFS;
}

async function main(): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const profilePath = join(here, "..", "seed", "athlete-profile.json");
  const profile = JSON.parse(
    readFileSync(profilePath, "utf8")
  ) as SeedProfile;

  // Idempotent reseed for the single-user app.
  await prisma.workoutLog.deleteMany();
  await prisma.plannedSession.deleteMany();
  await prisma.fitnessTest.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.race.deleteMany();
  await prisma.skillCheckpoint.deleteMany();
  await prisma.raceResult.deleteMany();
  await prisma.athlete.deleteMany();

  const athlete = await prisma.athlete.create({
    data: {
      name: profile.athlete.name,
      bodyMassKg: profile.athlete.bodyMassKg,
      sweatRateLPerH: profile.athlete.sweatRateLPerH,
      weeklyHoursAvailable: profile.athlete.weeklyHoursAvailable,
      restDays: profile.athlete.restDays ?? undefined,
      longDay: profile.athlete.longDay,
      recoveryBlockWeeks: profile.athlete.recoveryBlockWeeks,
      hasBike: profile.equipment.hasBike,
      bikeFitDone: profile.equipment.bikeFitDone,
      hasIndoorTrainer: profile.equipment.hasIndoorTrainer,
      hasClipless: profile.equipment.hasClipless,
      swimStatus: toDisciplineStatus(profile.disciplineStatus.swim),
      bikeStatus: toDisciplineStatus(profile.disciplineStatus.bike),
      runStatus: toDisciplineStatus(profile.disciplineStatus.run),
    },
  });

  for (const result of profile.raceResults) {
    await prisma.raceResult.create({
      data: {
        athleteId: athlete.id,
        distanceM: result.distanceM,
        timeSec: result.timeSec,
        label: result.label,
        date: result.date,
        conditionsNote: result.conditionsNote,
      },
    });
  }

  const race = await prisma.race.create({
    data: {
      athleteId: athlete.id,
      name: profile.race.name,
      date: profile.race.date,
      swimM: profile.race.swimM,
      bikeKm: profile.race.bikeKm,
      runKm: profile.race.runKm,
      startTimeLocal: profile.race.startTimeLocal,
      aidStationsBikeKm: profile.race.aidStationsBikeKm,
      aidStationsRunKm: profile.race.aidStationsRunSpacingKm,
      cutoffs: profile.race.cutoffs,
    },
  });

  const splits = profile.goal.splitsSec;
  const stretchTotal =
    splits.swim + splits.t1 + splits.bike + splits.t2 + splits.run;

  for (const tier of profile.goal.tiers) {
    const isStretch = tier.tier === "SUB_600";
    await prisma.goal.create({
      data: {
        raceId: race.id,
        tier: toGoalTier(tier.tier),
        finishSec: isStretch
          ? stretchTotal
          : (tier.finishUnderSec ?? null),
        swimSec: isStretch ? splits.swim : null,
        t1Sec: isStretch ? splits.t1 : null,
        bikeSec: isStretch ? splits.bike : null,
        t2Sec: isStretch ? splits.t2 : null,
        runSec: isStretch ? splits.run : null,
        bufferSec: isStretch ? profile.goal.bufferSec : null,
      },
    });
  }

  if (profile.fitness.thresholdRunPaceSecPerKm !== null) {
    await prisma.fitnessTest.create({
      data: {
        athleteId: athlete.id,
        date: "2026-11-10",
        kind: FitnessTestKind.RUN_THRESHOLD,
        value: profile.fitness.thresholdRunPaceSecPerKm,
        estimated: profile.fitness.thresholdRunPaceEstimate?.estimated ?? true,
        source: FitnessTestSource.RACE_RESULT,
        rawJson: profile.fitness.thresholdRunPaceEstimate ?? undefined,
      },
    });
  }

  const tracks = buildSkillTracks({
    today: "2026-11-10",
    prepEndDate: "2026-11-22",
    peakStartDate: "2027-04-19",
    buildStartDate: "2027-02-15",
  });

  for (const checkpoint of [...tracks.swim, ...tracks.bike]) {
    await prisma.skillCheckpoint.create({
      data: {
        athleteId: athlete.id,
        sport: checkpoint.sport === "swim" ? "SWIM" : "BIKE",
        code: checkpoint.code,
        description: checkpoint.description,
        targetDate: checkpoint.targetDate,
        doneDate: checkpoint.doneDate,
      },
    });
  }

  console.log(
    `Seeded athlete=${athlete.name} race=${race.name} results=${profile.raceResults.length} hasBike=${athlete.hasBike}`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
