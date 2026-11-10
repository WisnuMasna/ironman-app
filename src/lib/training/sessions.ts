import {
  DEFAULT_RUN_SESSIONS_CAP,
  MAX_HARD_SESSIONS_PER_WEEK,
  TAPER_VOLUME_FRACTION,
} from "./constants";
import type { PhaseName, PhasePlan } from "./phases";
import { planBikeSessionMode } from "./skills";

export type DisciplineStatus = "skill" | "zones";

export type SessionTargets =
  | { kind: "skill"; checkpointHint: string; rpe: number }
  | { kind: "zone"; zone: string };

export type PlannedSession = {
  sport: "swim" | "bike" | "run" | "brick" | "strength";
  type: string;
  durationMin: number;
  isHard: boolean;
  maxZone: string | null;
  targets: SessionTargets;
  outdoor: boolean;
};

export type DayPlan = {
  date: string;
  dayOfWeek: number; // 1=Mon … 7=Sun
  sessions: PlannedSession[];
};

export type WeekPlan = {
  weekStartMonday: string;
  phase: PhaseName;
  isRecoveryWeek: boolean;
  days: DayPlan[];
};

export type SessionAthlete = {
  weeklyHoursAvailable: number;
  restDays: number[];
  longDay: number;
  recoveryBlockWeeks: number;
  disciplineStatus: {
    swim: DisciplineStatus;
    bike: DisciplineStatus;
    run: DisciplineStatus;
  };
  hasBike: boolean;
  bikeFitDone?: boolean;
  runSessionsCap?: number;
};

export type SessionResult =
  | { ok: true; value: WeekPlan }
  | { ok: false; error: "invalid-date" | "unknown-phase" };

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

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function phaseForDate(plan: PhasePlan, iso: string): PhaseName | null {
  for (const phase of plan.phases) {
    if (iso >= phase.startDate && iso <= phase.endDate) {
      return phase.name;
    }
  }
  return null;
}

function scaleDuration(durationMin: number, fraction: number): number {
  return Math.max(15, Math.round(durationMin * fraction));
}

/**
 * Generates one week of sessions for the athlete.
 * Pure function: phase, equipment, and discipline status drive structure and targets.
 */
export function generateWeekSessions(input: {
  weekStartMonday: string;
  raceDate: string;
  today: string;
  athlete: SessionAthlete;
  phasePlan: PhasePlan;
}): SessionResult {
  const monday = parseLocalDate(input.weekStartMonday);
  if (monday === null || monday.getDay() !== 1) {
    return { ok: false, error: "invalid-date" };
  }

  // Prefer the phase covering Monday; if the week starts just before a phase
  // (e.g. Prep begins mid-week), use the first phase that overlaps Mon–Sun.
  let phase = phaseForDate(input.phasePlan, input.weekStartMonday);
  if (phase === null) {
    for (let offset = 1; offset <= 6; offset += 1) {
      const iso = formatLocalDate(addDays(monday, offset));
      phase = phaseForDate(input.phasePlan, iso);
      if (phase !== null) break;
    }
  }
  if (phase === null) {
    return { ok: false, error: "unknown-phase" };
  }

  const isRecoveryWeek = input.phasePlan.recoveryWeekStartDates.includes(
    input.weekStartMonday
  );
  const volumeFraction = phase === "Taper" ? TAPER_VOLUME_FRACTION : 1;
  const allowHard =
    !isRecoveryWeek &&
    phase !== "Prep" &&
    !(phase === "Base" && isEarlyBase(input.weekStartMonday, input.phasePlan));

  // PLAN.md M10 / §5.6: hasBike false → indoor-bridge only; hasBike true → outdoor allowed.
  // B1/fit skill gating stays in skills.ts until checkpoint ticking (M11).
  const bikeMode = planBikeSessionMode({
    hasBike: input.athlete.hasBike,
    bikeFitDone: input.athlete.hasBike,
    checkpointB1Done: input.athlete.hasBike,
  });

  const runCap = input.athlete.runSessionsCap ?? DEFAULT_RUN_SESSIONS_CAP;

  // Fixed template: 3 swim, 2 bike, 2 run — swim-priority for this athlete (PLAN.md §7.5).
  // dayOfWeek 1=Mon … 7=Sun
  type Slot = {
    dayOfWeek: number;
    sport: PlannedSession["sport"];
    type: string;
    durationMin: number;
    isHard: boolean;
    maxZone: string | null;
  };

  const template: Slot[] = [
    {
      dayOfWeek: 2,
      sport: "swim",
      type: "skill",
      durationMin: 45,
      isHard: false,
      maxZone: null,
    },
    {
      dayOfWeek: 3,
      sport: "bike",
      type: bikeMode.mode,
      durationMin: 60,
      isHard: false,
      maxZone: null,
    },
    {
      dayOfWeek: 3,
      sport: "run",
      type: "easy",
      durationMin: 40,
      isHard: false,
      maxZone: "Z2",
    },
    {
      dayOfWeek: 4,
      sport: "swim",
      type: "skill",
      durationMin: 45,
      isHard: false,
      maxZone: null,
    },
    {
      dayOfWeek: 5,
      sport: "run",
      type: allowHard ? "quality" : "easy",
      durationMin: 45,
      isHard: allowHard,
      maxZone: allowHard ? "Z3" : "Z2",
    },
    {
      dayOfWeek: 6,
      sport: "swim",
      type: "skill",
      durationMin: 50,
      isHard: false,
      maxZone: null,
    },
    {
      dayOfWeek: 7,
      sport: "bike",
      type: bikeMode.mode,
      durationMin: input.athlete.longDay === 7 ? 90 : 60,
      isHard: false,
      maxZone: null,
    },
  ];

  // In Build/Peak, one hard bike instead of easy mid-week when allowed.
  if (allowHard && (phase === "Build" || phase === "Peak")) {
    const bikeSlot = template.find(
      (s) => s.sport === "bike" && s.dayOfWeek === 3
    );
    if (bikeSlot) {
      bikeSlot.isHard = true;
      bikeSlot.maxZone = "Z4";
      bikeSlot.type = bikeMode.mode === "indoor-bridge" ? "indoor-bridge" : "intervals";
    }
  }

  // Cap hard sessions.
  let hardCount = template.filter((s) => s.isHard).length;
  if (hardCount > MAX_HARD_SESSIONS_PER_WEEK) {
    for (const slot of template) {
      if (hardCount <= MAX_HARD_SESSIONS_PER_WEEK) break;
      if (slot.isHard) {
        slot.isHard = false;
        slot.maxZone = slot.maxZone === "Z4" ? "Z2" : slot.maxZone;
        hardCount -= 1;
      }
    }
  }

  // Cap run sessions.
  let runCount = template.filter((s) => s.sport === "run").length;
  if (runCount > runCap) {
    for (let i = template.length - 1; i >= 0 && runCount > runCap; i -= 1) {
      if (template[i].sport === "run") {
        template.splice(i, 1);
        runCount -= 1;
      }
    }
  }

  const days: DayPlan[] = [];
  for (let dow = 1; dow <= 7; dow += 1) {
    const date = formatLocalDate(addDays(monday, dow - 1));
    if (input.athlete.restDays.includes(dow)) {
      days.push({ date, dayOfWeek: dow, sessions: [] });
      continue;
    }
    const sessions: PlannedSession[] = template
      .filter((s) => s.dayOfWeek === dow)
      .map((slot) => toSession(slot, input.athlete, volumeFraction, bikeMode.outdoorAllowed));
    days.push({ date, dayOfWeek: dow, sessions });
  }

  return {
    ok: true,
    value: {
      weekStartMonday: input.weekStartMonday,
      phase,
      isRecoveryWeek,
      days,
    },
  };
}

function isEarlyBase(weekStartMonday: string, plan: PhasePlan): boolean {
  const base = plan.phases.find((p) => p.name === "Base");
  if (!base) return false;
  // First recovery-block length of Base ≈ Base 1 (no Z4+).
  const baseStart = parseLocalDate(base.startDate);
  const weekStart = parseLocalDate(weekStartMonday);
  if (baseStart === null || weekStart === null) return false;
  const diffDays = Math.round(
    (weekStart.getTime() - baseStart.getTime()) / (24 * 60 * 60 * 1000)
  );
  return diffDays < 21;
}

function toSession(
  slot: {
    sport: PlannedSession["sport"];
    type: string;
    durationMin: number;
    isHard: boolean;
    maxZone: string | null;
  },
  athlete: SessionAthlete,
  volumeFraction: number,
  outdoorAllowed: boolean
): PlannedSession {
  const status =
    slot.sport === "swim"
      ? athlete.disciplineStatus.swim
      : slot.sport === "bike"
        ? athlete.disciplineStatus.bike
        : athlete.disciplineStatus.run;

  const targets: SessionTargets =
    status === "skill"
      ? {
          kind: "skill",
          checkpointHint: slot.sport === "swim" ? "S0" : "B0",
          rpe: slot.isHard ? 7 : 4,
        }
      : { kind: "zone", zone: slot.maxZone ?? "Z2" };

  return {
    sport: slot.sport,
    type: slot.type,
    durationMin: scaleDuration(slot.durationMin, volumeFraction),
    isHard: slot.isHard,
    maxZone: status === "skill" ? null : slot.maxZone,
    targets,
    outdoor: slot.sport === "bike" ? outdoorAllowed : false,
  };
}
