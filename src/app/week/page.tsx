import { Suspense } from "react";
import { loadWeekPlan } from "@/lib/db/plan";
import { requestNow } from "../request-now";
import { DaySessions } from "../ui/session-list";

export default function WeekPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">This week</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading week…</p>}>
        <WeekContent />
      </Suspense>
    </main>
  );
}

async function WeekContent() {
  const plan = await loadWeekPlan(await requestNow());
  if (plan === null) {
    return <p>No athlete seeded. Run `npx prisma db seed`.</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Week of {plan.weekStartMonday} · {plan.week.phase}
        {plan.week.isRecoveryWeek ? " · recovery week" : ""} · bike{" "}
        {plan.athlete.hasBike ? "outdoor allowed" : "indoor bridge"} · bike status{" "}
        {plan.athlete.bikeStatus.toLowerCase()}
      </p>
      {plan.repeatNextLoadWeek ? (
        <p className="text-sm text-amber-700">
          Weekly compliance is low — the next load week will repeat instead of progressing.
        </p>
      ) : null}
      {plan.checkpointWarning === "checkpoint-past-peak" ? (
        <p className="text-sm text-amber-700">
          A slipped checkpoint would push S6 or B7 past Peak week.
        </p>
      ) : null}
      {plan.week.days.map((day) => (
        <DaySessions key={day.date} day={day} logs={plan.athlete.workoutLogs} />
      ))}
    </div>
  );
}
