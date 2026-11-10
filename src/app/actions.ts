"use server";

import { WorkoutStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  getAthlete,
  logWorkout,
  recordFtpTest,
  saveSkillTracks,
  updateEquipment,
} from "@/lib/db/athlete";
import { calendarDateInZone } from "@/lib/db/plan";
import { tracksFromDb, tracksToRows } from "@/lib/db/tracks";
import { buildPhases } from "@/lib/training/phases";
import type { PlannedSession } from "@/lib/training/sessions";
import {
  tickCheckpoint,
  type BikeCheckpointCode,
  type SwimCheckpointCode,
} from "@/lib/training/skills";
import { requestNow } from "./request-now";

const RACE_TIMEZONE = "Asia/Ho_Chi_Minh";

function revalidateApp(): void {
  revalidatePath("/");
  revalidatePath("/week");
  revalidatePath("/profile");
}

export async function saveEquipment(formData: FormData): Promise<void> {
  const athlete = await getAthlete();
  if (athlete === null) return;

  await updateEquipment(athlete.id, {
    hasBike: formData.get("hasBike") === "on",
    bikeFitDone: formData.get("bikeFitDone") === "on",
    hasIndoorTrainer: formData.get("hasIndoorTrainer") === "on",
    hasClipless: formData.get("hasClipless") === "on",
  });
  revalidateApp();
}

export async function saveFtp(formData: FormData): Promise<void> {
  const athlete = await getAthlete();
  if (athlete === null) return;

  const raw = formData.get("ftpWatts");
  const ftpWatts = typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(ftpWatts) || ftpWatts <= 0) return;

  const today = calendarDateInZone(await requestNow(), RACE_TIMEZONE);
  await recordFtpTest(athlete.id, ftpWatts, today);
  revalidateApp();
}

function parseSport(raw: FormDataEntryValue | null): PlannedSession["sport"] | null {
  if (typeof raw !== "string") return null;
  if (
    raw === "swim" ||
    raw === "bike" ||
    raw === "run" ||
    raw === "brick" ||
    raw === "strength"
  ) {
    return raw;
  }
  return null;
}

function parseStatus(raw: FormDataEntryValue | null): WorkoutStatus | null {
  if (raw === "DONE" || raw === "PARTIAL" || raw === "MISSED") return raw;
  return null;
}

export async function saveWorkoutLog(formData: FormData): Promise<void> {
  const athlete = await getAthlete();
  if (athlete === null) return;

  const date = formData.get("date");
  const sport = parseSport(formData.get("sport"));
  const status = parseStatus(formData.get("status"));
  const durationRaw = formData.get("durationMin");
  const rpeRaw = formData.get("rpe");
  if (typeof date !== "string" || sport === null || status === null) return;
  const durationMin = typeof durationRaw === "string" ? Number(durationRaw) : NaN;
  if (!Number.isFinite(durationMin) || durationMin < 0) return;
  const rpe =
    typeof rpeRaw === "string" && rpeRaw.length > 0 ? Number(rpeRaw) : null;
  if (rpe !== null && (!Number.isFinite(rpe) || rpe < 1 || rpe > 10)) return;

  await logWorkout({
    athleteId: athlete.id,
    date,
    sport,
    durationMin,
    status,
    rpe,
    notes: null,
  });
  revalidateApp();
}

export async function markCheckpointDone(formData: FormData): Promise<void> {
  const athlete = await getAthlete();
  if (athlete === null || athlete.races.length === 0) return;

  const codeRaw = formData.get("code");
  if (typeof codeRaw !== "string") return;
  if (!/^([SB][0-7])$/.test(codeRaw)) return;

  const today = calendarDateInZone(await requestNow(), RACE_TIMEZONE);
  const raceDate = athlete.races[0].date;
  const phases = buildPhases(raceDate, today, athlete.recoveryBlockWeeks);
  const peakStartDate = phases.ok
    ? (phases.value.phases.find((p) => p.name === "Peak")?.startDate ?? raceDate)
    : raceDate;

  const ticked = tickCheckpoint(
    tracksFromDb(athlete.skillCheckpoints),
    codeRaw as SwimCheckpointCode | BikeCheckpointCode,
    today,
    { peakStartDate }
  );
  if (!ticked.ok) return;
  await saveSkillTracks(athlete.id, tracksToRows(ticked.value));
  revalidateApp();
}
