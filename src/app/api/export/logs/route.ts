import { getAthlete } from "@/lib/db/athlete";
import { workoutLogsToCsv } from "@/lib/training/backup";

export async function GET(): Promise<Response> {
  const athlete = await getAthlete();
  if (athlete === null) {
    return new Response("No athlete", { status: 404 });
  }

  const csv = workoutLogsToCsv(
    athlete.workoutLogs.map((log) => ({
      date: log.date,
      sport: log.sport,
      durationMin: log.durationMin,
      status: log.status,
      rpe: log.rpe,
      notes: log.notes,
      movedToDate: log.movedToDate,
    }))
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="workout-logs.csv"',
    },
  });
}
