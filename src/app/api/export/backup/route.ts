import { getAthlete } from "@/lib/db/athlete";
import { buildBackupPayload } from "@/lib/training/backup";
import { requestNow } from "@/app/request-now";

export async function GET(): Promise<Response> {
  const athlete = await getAthlete();
  if (athlete === null) {
    return new Response("No athlete", { status: 404 });
  }

  const now = await requestNow();
  const payload = buildBackupPayload({
    exportedAt: now.toISOString(),
    athlete: {
      name: athlete.name,
      bodyMassKg: athlete.bodyMassKg,
      sweatRateLPerH: athlete.sweatRateLPerH,
      hasBike: athlete.hasBike,
      bikeFitDone: athlete.bikeFitDone,
      hasIndoorTrainer: athlete.hasIndoorTrainer,
      hasClipless: athlete.hasClipless,
      swimStatus: athlete.swimStatus,
      bikeStatus: athlete.bikeStatus,
      runStatus: athlete.runStatus,
    },
    checkpoints: athlete.skillCheckpoints.map((c) => ({
      code: c.code,
      sport: c.sport,
      description: c.description,
      targetDate: c.targetDate,
      doneDate: c.doneDate,
    })),
    workoutLogs: athlete.workoutLogs.map((log) => ({
      date: log.date,
      sport: log.sport,
      durationMin: log.durationMin,
      status: log.status,
      rpe: log.rpe,
      notes: log.notes,
      movedToDate: log.movedToDate,
    })),
    fitnessTests: athlete.fitnessTests.map((t) => ({
      date: t.date,
      kind: t.kind,
      value: t.value,
      estimated: t.estimated,
    })),
  });

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ironman-backup.json"',
    },
  });
}
