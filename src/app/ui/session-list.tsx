import type { WorkoutLog } from "@prisma/client";
import { saveWorkoutLog } from "../actions";
import type { DayPlan, PlannedSession } from "@/lib/training/sessions";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function sessionLabel(session: PlannedSession): string {
  const sport = session.sport;
  const where = session.sport === "bike" && session.outdoor ? "outdoor" : session.type;
  if (session.targets.kind === "skill") {
    return `${sport} · ${where} · RPE ${session.targets.rpe} · ${session.durationMin} min`;
  }
  return `${sport} · ${where} · ${session.targets.zone} · ${session.durationMin} min`;
}

function logKey(date: string, sport: string): string {
  return `${date}|${sport}`;
}

export function SessionCard({
  session,
  date,
  log,
}: {
  session: PlannedSession;
  date: string;
  log: WorkoutLog | null;
}) {
  return (
    <li className="space-y-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
      <p className="font-medium capitalize">{sessionLabel(session)}</p>
      {session.outdoor ? (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">Outdoor ride</p>
      ) : session.sport === "bike" ? (
        <p className="text-xs text-zinc-500">Indoor / bridge</p>
      ) : null}
      {log !== null ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Logged: {log.status.toLowerCase()}
          {log.rpe !== null ? ` · RPE ${log.rpe}` : ""} · {log.durationMin} min
        </p>
      ) : null}
      <form action={saveWorkoutLog} className="flex flex-wrap items-end gap-2 text-xs">
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="sport" value={session.sport} />
        <input type="hidden" name="durationMin" value={session.durationMin} />
        <label className="flex flex-col gap-1">
          Status
          <select
            name="status"
            defaultValue={log?.status ?? "DONE"}
            className="rounded border border-zinc-300 bg-white px-1 py-0.5 dark:border-zinc-600 dark:bg-zinc-900"
          >
            <option value="DONE">Done</option>
            <option value="PARTIAL">Partial</option>
            <option value="MISSED">Missed</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          RPE
          <input
            type="number"
            name="rpe"
            min={1}
            max={10}
            defaultValue={log?.rpe ?? ""}
            className="w-16 rounded border border-zinc-300 px-1 py-0.5 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-zinc-900 px-2 py-1 text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Log
        </button>
      </form>
    </li>
  );
}

export function DaySessions({
  day,
  logs,
}: {
  day: DayPlan;
  logs: WorkoutLog[];
}) {
  const name = DAY_NAMES[day.dayOfWeek - 1] ?? "";
  const byKey = new Map(
    logs.map((log) => [logKey(log.date, log.sport.toLowerCase()), log])
  );
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">
        {name} {day.date}
      </h3>
      {day.sessions.length === 0 ? (
        <p className="text-sm text-zinc-500">Rest</p>
      ) : (
        <ul className="space-y-2">
          {day.sessions.map((session, index) => (
            <SessionCard
              key={`${day.date}-${session.sport}-${index}`}
              session={session}
              date={day.date}
              log={byKey.get(logKey(day.date, session.sport)) ?? null}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
