"use server";

import { revalidatePath } from "next/cache";
import { getAthlete, recordFtpTest, updateEquipment } from "@/lib/db/athlete";
import { calendarDateInZone } from "@/lib/db/plan";
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
