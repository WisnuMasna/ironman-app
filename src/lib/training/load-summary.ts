import type { PlannedSession, WeekPlan } from "./sessions";

export type LoadLog = {
  date: string;
  sport: PlannedSession["sport"];
  durationMin: number;
  status: "DONE" | "PARTIAL" | "MISSED";
};

export type SportLoad = {
  plannedSessions: number;
  doneSessions: number;
  plannedMin: number;
  doneMin: number;
};

export type WeekLoadSummary = {
  plannedSessions: number;
  doneSessions: number;
  partialSessions: number;
  plannedHours: number;
  doneHours: number;
  hardSessionCount: number;
  bySport: Record<"swim" | "bike" | "run" | "brick" | "strength", SportLoad>;
  /** True when more than half of planned sessions sit in Z3/Z4 (Seiler "black hole"). */
  thresholdBlackHole: boolean;
};

const EMPTY_SPORT: SportLoad = {
  plannedSessions: 0,
  doneSessions: 0,
  plannedMin: 0,
  doneMin: 0,
};

function emptyBySport(): WeekLoadSummary["bySport"] {
  return {
    swim: { ...EMPTY_SPORT },
    bike: { ...EMPTY_SPORT },
    run: { ...EMPTY_SPORT },
    brick: { ...EMPTY_SPORT },
    strength: { ...EMPTY_SPORT },
  };
}

function isThresholdZone(session: PlannedSession): boolean {
  if (session.targets.kind !== "zone") return false;
  const zone = session.targets.zone;
  return zone === "Z3" || zone === "Z4";
}

/**
 * Planned vs done weekly load, with a threshold "black hole" flag.
 * SOURCE: PLAN.md §6.2 weekly load summary; Seiler & Tønnessen 2009 (§8.3)
 */
export function summarizeWeekLoad(input: {
  week: WeekPlan;
  logs: LoadLog[];
}): WeekLoadSummary {
  const bySport = emptyBySport();
  let plannedSessions = 0;
  let plannedMin = 0;
  let hardSessionCount = 0;
  let thresholdSessions = 0;

  for (const day of input.week.days) {
    for (const session of day.sessions) {
      plannedSessions += 1;
      plannedMin += session.durationMin;
      if (session.isHard) hardSessionCount += 1;
      if (isThresholdZone(session)) thresholdSessions += 1;
      const bucket = bySport[session.sport];
      bucket.plannedSessions += 1;
      bucket.plannedMin += session.durationMin;
    }
  }

  let doneSessions = 0;
  let partialSessions = 0;
  let doneMin = 0;

  for (const log of input.logs) {
    if (log.status === "DONE") {
      doneSessions += 1;
      doneMin += log.durationMin;
      bySport[log.sport].doneSessions += 1;
      bySport[log.sport].doneMin += log.durationMin;
    } else if (log.status === "PARTIAL") {
      partialSessions += 1;
      doneMin += log.durationMin;
      bySport[log.sport].doneMin += log.durationMin;
    }
  }

  return {
    plannedSessions,
    doneSessions,
    partialSessions,
    plannedHours: plannedMin / 60,
    doneHours: doneMin / 60,
    hardSessionCount,
    bySport,
    thresholdBlackHole:
      plannedSessions > 0 && thresholdSessions / plannedSessions > 0.5,
  };
}
