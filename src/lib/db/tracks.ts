import type { SkillCheckpoint as DbCheckpoint } from "@prisma/client";
import {
  OPEN_WATER_SAFETY_CHECKLIST,
  type BikeCheckpointCode,
  type SkillCheckpoint,
  type SkillTracks,
  type SwimCheckpointCode,
} from "../training/skills";

const SWIM_CODES: SwimCheckpointCode[] = [
  "S0",
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "S6",
];
const BIKE_CODES: BikeCheckpointCode[] = [
  "B0",
  "B1",
  "B2",
  "B3",
  "B4",
  "B5",
  "B6",
  "B7",
];

function isSwimCode(code: string): code is SwimCheckpointCode {
  return SWIM_CODES.some((c) => c === code);
}

function isBikeCode(code: string): code is BikeCheckpointCode {
  return BIKE_CODES.some((c) => c === code);
}

function toSkillCheckpoint(row: DbCheckpoint): SkillCheckpoint | null {
  if (isSwimCode(row.code)) {
    const openWater = row.code === "S4" || row.code === "S5" || row.code === "S6";
    return {
      code: row.code,
      sport: "swim",
      description: row.description,
      targetDate: row.targetDate,
      doneDate: row.doneDate,
      openWaterChecklist: openWater ? OPEN_WATER_SAFETY_CHECKLIST : undefined,
      soloAllowed: openWater ? false : undefined,
    };
  }
  if (isBikeCode(row.code)) {
    return {
      code: row.code,
      sport: "bike",
      description: row.description,
      targetDate: row.targetDate,
      doneDate: row.doneDate,
    };
  }
  return null;
}

export function tracksFromDb(rows: DbCheckpoint[]): SkillTracks {
  const mapped = rows
    .map(toSkillCheckpoint)
    .filter((c): c is SkillCheckpoint => c !== null);
  return {
    swim: mapped.filter((c) => c.sport === "swim"),
    bike: mapped.filter((c) => c.sport === "bike"),
    warning: null,
  };
}

export function tracksToRows(tracks: SkillTracks): Array<{
  code: string;
  sport: "SWIM" | "BIKE";
  description: string;
  targetDate: string;
  doneDate: string | null;
}> {
  return [...tracks.swim, ...tracks.bike].map((c) => ({
    code: c.code,
    sport: c.sport === "swim" ? "SWIM" : "BIKE",
    description: c.description,
    targetDate: c.targetDate,
    doneDate: c.doneDate,
  }));
}
