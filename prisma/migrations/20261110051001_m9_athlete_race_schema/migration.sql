-- CreateTable
CREATE TABLE "Athlete" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "bodyMassKg" REAL,
    "sweatRateLPerH" REAL,
    "weeklyHoursAvailable" REAL,
    "restDays" JSONB,
    "longDay" INTEGER,
    "recoveryBlockWeeks" INTEGER NOT NULL DEFAULT 3,
    "hasBike" BOOLEAN NOT NULL DEFAULT false,
    "bikeFitDone" BOOLEAN NOT NULL DEFAULT false,
    "hasIndoorTrainer" BOOLEAN NOT NULL DEFAULT false,
    "hasClipless" BOOLEAN NOT NULL DEFAULT false,
    "swimStatus" TEXT NOT NULL DEFAULT 'SKILL',
    "bikeStatus" TEXT NOT NULL DEFAULT 'SKILL',
    "runStatus" TEXT NOT NULL DEFAULT 'ZONES'
);

-- CreateTable
CREATE TABLE "RaceResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "athleteId" INTEGER NOT NULL,
    "date" TEXT,
    "distanceM" REAL NOT NULL,
    "timeSec" INTEGER NOT NULL,
    "conditionsNote" TEXT,
    "label" TEXT,
    CONSTRAINT "RaceResult_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillCheckpoint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "athleteId" INTEGER NOT NULL,
    "sport" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetDate" TEXT NOT NULL,
    "doneDate" TEXT,
    CONSTRAINT "SkillCheckpoint_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Race" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "athleteId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "swimM" INTEGER NOT NULL,
    "bikeKm" REAL NOT NULL,
    "runKm" REAL NOT NULL,
    "startTimeLocal" TEXT NOT NULL,
    "aidStationsBikeKm" JSONB NOT NULL,
    "aidStationsRunKm" JSONB NOT NULL,
    "cutoffs" JSONB NOT NULL,
    CONSTRAINT "Race_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "raceId" INTEGER NOT NULL,
    "tier" TEXT NOT NULL,
    "finishSec" INTEGER,
    "swimSec" INTEGER,
    "t1Sec" INTEGER,
    "bikeSec" INTEGER,
    "t2Sec" INTEGER,
    "runSec" INTEGER,
    "bufferSec" INTEGER,
    CONSTRAINT "Goal_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FitnessTest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "athleteId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "estimated" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL,
    "rawJson" JSONB,
    CONSTRAINT "FitnessTest_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlannedSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "athleteId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "weekOut" INTEGER NOT NULL,
    "sport" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "structure" JSONB,
    "targets" JSONB,
    "isKey" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PlannedSession_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "plannedSessionId" INTEGER,
    "athleteId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "distanceM" REAL,
    "avgPower" REAL,
    "avgPaceSec" REAL,
    "avgHr" INTEGER,
    "rpe" INTEGER,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "heatExposure" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "WorkoutLog_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkoutLog_plannedSessionId_fkey" FOREIGN KEY ("plannedSessionId") REFERENCES "PlannedSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillCheckpoint_athleteId_code_key" ON "SkillCheckpoint"("athleteId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Goal_raceId_tier_key" ON "Goal"("raceId", "tier");
