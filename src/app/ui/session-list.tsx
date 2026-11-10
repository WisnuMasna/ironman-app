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

export function SessionCard({ session }: { session: PlannedSession }) {
  return (
    <li className="rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
      <p className="font-medium capitalize">{sessionLabel(session)}</p>
      {session.outdoor ? (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">Outdoor ride</p>
      ) : session.sport === "bike" ? (
        <p className="text-xs text-zinc-500">Indoor / bridge</p>
      ) : null}
    </li>
  );
}

export function DaySessions({ day }: { day: DayPlan }) {
  const name = DAY_NAMES[day.dayOfWeek - 1] ?? "";
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
            <SessionCard key={`${day.date}-${session.sport}-${index}`} session={session} />
          ))}
        </ul>
      )}
    </section>
  );
}
