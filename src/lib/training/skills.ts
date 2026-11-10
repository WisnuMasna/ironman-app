import {
  OPEN_WATER_SAFETY_CHECKLIST as OPEN_WATER_SAFETY_CHECKLIST_CONST,
  SKILL_BIKE_B5_TARGET_DATE,
  SKILL_BIKE_OFFSET_DAYS_FROM_B0,
  SKILL_SWIM_TARGET_DATES,
} from "./constants";

export const OPEN_WATER_SAFETY_CHECKLIST: readonly string[] = [
  ...OPEN_WATER_SAFETY_CHECKLIST_CONST,
];

export type SwimCheckpointCode = "S0" | "S1" | "S2" | "S3" | "S4" | "S5" | "S6";
export type BikeCheckpointCode =
  | "B0"
  | "B1"
  | "B2"
  | "B3"
  | "B4"
  | "B5"
  | "B6"
  | "B7";

export type SkillCheckpoint = {
  code: SwimCheckpointCode | BikeCheckpointCode;
  sport: "swim" | "bike";
  description: string;
  targetDate: string;
  doneDate: string | null;
  openWaterChecklist?: readonly string[];
  soloAllowed?: boolean;
};

export type SkillTracks = {
  swim: SkillCheckpoint[];
  bike: SkillCheckpoint[];
  warning: "checkpoint-past-peak" | null;
};

export type SkillResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: "unknown-checkpoint" | "invalid-date" };

export type TestPrompt = {
  kind: "CSS" | "FTP";
  checkpoint: "S3" | "B5";
};

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseLocalDate(iso: string): Date | null {
  const match = DATE_RE.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysIso(iso: string, days: number): string {
  const date = parseLocalDate(iso);
  if (date === null) return iso;
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

function diffDays(laterIso: string, earlierIso: string): number {
  const later = parseLocalDate(laterIso);
  const earlier = parseLocalDate(earlierIso);
  if (later === null || earlier === null) return 0;
  const ms = later.getTime() - earlier.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

const SWIM_DESCRIPTIONS: Record<SwimCheckpointCode, string> = {
  S0: "Adult lessons booked; float, exhale underwater, tread water",
  S1: "25 m continuous freestyle",
  S2: "100 m continuous, relaxed breathing",
  S3: "400 m continuous — CSS test possible",
  S4: "1,000 m continuous; first supervised open-water swim",
  S5: "1.5 km continuous open water with sighting and buoy turns",
  S6: "1.9 km continuous sea swim under 1:10",
};

const BIKE_DESCRIPTIONS: Record<BikeCheckpointCode, string> = {
  B0: "Bike bought + professional fit + helmet",
  B1: "Empty car park skills",
  B2: "Clip in/out on trainer, then outdoors",
  B3: "Quiet roads: traffic rules, signalling",
  B4: "Ride near others; draft-zone race rules",
  B5: "Eat/drink while riding; 2 h continuous; FTP test possible",
  B6: "Aerobic volume + weekly brick",
  B7: "90 km continuous with race fuelling + brick run",
};

export function buildSkillTracks(input: {
  today: string;
  prepEndDate: string;
  peakStartDate: string;
  buildStartDate: string;
}): SkillTracks {
  const swim: SkillCheckpoint[] = [
    {
      code: "S0",
      sport: "swim",
      description: SWIM_DESCRIPTIONS.S0,
      targetDate: input.prepEndDate,
      doneDate: null,
    },
    {
      code: "S1",
      sport: "swim",
      description: SWIM_DESCRIPTIONS.S1,
      targetDate: SKILL_SWIM_TARGET_DATES.S1,
      doneDate: null,
    },
    {
      code: "S2",
      sport: "swim",
      description: SWIM_DESCRIPTIONS.S2,
      targetDate: SKILL_SWIM_TARGET_DATES.S2,
      doneDate: null,
    },
    {
      code: "S3",
      sport: "swim",
      description: SWIM_DESCRIPTIONS.S3,
      targetDate: SKILL_SWIM_TARGET_DATES.S3,
      doneDate: null,
    },
    {
      code: "S4",
      sport: "swim",
      description: SWIM_DESCRIPTIONS.S4,
      targetDate: SKILL_SWIM_TARGET_DATES.S4,
      doneDate: null,
      openWaterChecklist: OPEN_WATER_SAFETY_CHECKLIST,
      soloAllowed: false,
    },
    {
      code: "S5",
      sport: "swim",
      description: SWIM_DESCRIPTIONS.S5,
      targetDate: SKILL_SWIM_TARGET_DATES.S5,
      doneDate: null,
      openWaterChecklist: OPEN_WATER_SAFETY_CHECKLIST,
      soloAllowed: false,
    },
    {
      code: "S6",
      sport: "swim",
      description: SWIM_DESCRIPTIONS.S6,
      targetDate: input.peakStartDate,
      doneDate: null,
      openWaterChecklist: OPEN_WATER_SAFETY_CHECKLIST,
      soloAllowed: false,
    },
  ];

  const b0 = input.prepEndDate;
  const bike: SkillCheckpoint[] = [
    {
      code: "B0",
      sport: "bike",
      description: BIKE_DESCRIPTIONS.B0,
      targetDate: b0,
      doneDate: null,
    },
    {
      code: "B1",
      sport: "bike",
      description: BIKE_DESCRIPTIONS.B1,
      targetDate: addDaysIso(b0, SKILL_BIKE_OFFSET_DAYS_FROM_B0.B1),
      doneDate: null,
    },
    {
      code: "B2",
      sport: "bike",
      description: BIKE_DESCRIPTIONS.B2,
      targetDate: addDaysIso(b0, SKILL_BIKE_OFFSET_DAYS_FROM_B0.B2),
      doneDate: null,
    },
    {
      code: "B3",
      sport: "bike",
      description: BIKE_DESCRIPTIONS.B3,
      targetDate: addDaysIso(b0, SKILL_BIKE_OFFSET_DAYS_FROM_B0.B3),
      doneDate: null,
    },
    {
      code: "B4",
      sport: "bike",
      description: BIKE_DESCRIPTIONS.B4,
      targetDate: addDaysIso(b0, SKILL_BIKE_OFFSET_DAYS_FROM_B0.B4),
      doneDate: null,
    },
    {
      code: "B5",
      sport: "bike",
      description: BIKE_DESCRIPTIONS.B5,
      targetDate: SKILL_BIKE_B5_TARGET_DATE,
      doneDate: null,
    },
    {
      code: "B6",
      sport: "bike",
      description: BIKE_DESCRIPTIONS.B6,
      targetDate: input.buildStartDate,
      doneDate: null,
    },
    {
      code: "B7",
      sport: "bike",
      description: BIKE_DESCRIPTIONS.B7,
      targetDate: input.peakStartDate,
      doneDate: null,
    },
  ];

  return { swim, bike, warning: null };
}

export function tickCheckpoint(
  tracks: SkillTracks,
  code: SwimCheckpointCode | BikeCheckpointCode,
  doneDate: string,
  options?: { peakStartDate?: string }
): SkillResult<SkillTracks> {
  if (parseLocalDate(doneDate) === null) {
    return { ok: false, error: "invalid-date" };
  }

  const swim = tracks.swim.map((c) => ({ ...c }));
  const bike = tracks.bike.map((c) => ({ ...c }));
  const list = code.startsWith("S") ? swim : bike;
  const index = list.findIndex((c) => c.code === code);
  if (index < 0) {
    return { ok: false, error: "unknown-checkpoint" };
  }

  const current = list[index];
  const slipDays = Math.max(0, diffDays(doneDate, current.targetDate));
  list[index] = { ...current, doneDate, targetDate: current.targetDate };

  if (slipDays > 0) {
    for (let i = index + 1; i < list.length; i += 1) {
      list[i] = {
        ...list[i],
        targetDate: addDaysIso(list[i].targetDate, slipDays),
      };
    }
  }

  const peakStartDate = options?.peakStartDate ?? "2027-04-19";
  const s6 = swim.find((c) => c.code === "S6");
  const b7 = bike.find((c) => c.code === "B7");
  const warning =
    (s6 !== undefined && s6.targetDate > peakStartDate) ||
    (b7 !== undefined && b7.targetDate > peakStartDate)
      ? "checkpoint-past-peak"
      : null;

  return {
    ok: true,
    value: { swim, bike, warning },
  };
}

export function getNextTestPrompt(
  tracks: SkillTracks
): { ok: true; value: TestPrompt } | { ok: false; error: "none" } {
  const s3 = tracks.swim.find((c) => c.code === "S3");
  if (s3?.doneDate) {
    return { ok: true, value: { kind: "CSS", checkpoint: "S3" } };
  }
  const b5 = tracks.bike.find((c) => c.code === "B5");
  if (b5?.doneDate) {
    return { ok: true, value: { kind: "FTP", checkpoint: "B5" } };
  }
  return { ok: false, error: "none" };
}

export function planBikeSessionMode(input: {
  hasBike: boolean;
  bikeFitDone?: boolean;
  checkpointB1Done?: boolean;
}): {
  mode: "indoor-bridge" | "indoor" | "outdoor-allowed";
  outdoorAllowed: boolean;
} {
  if (!input.hasBike) {
    return { mode: "indoor-bridge", outdoorAllowed: false };
  }
  if (!input.bikeFitDone || !input.checkpointB1Done) {
    return { mode: "indoor", outdoorAllowed: false };
  }
  return { mode: "outdoor-allowed", outdoorAllowed: true };
}
