import { Suspense } from "react";
import { loadWeekPlan } from "@/lib/db/plan";
import { requestNow } from "./request-now";
import { DaySessions } from "./ui/session-list";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading today…</p>}>
        <TodayContent />
      </Suspense>
    </main>
  );
}

async function TodayContent() {
  const plan = await loadWeekPlan(await requestNow());
  if (plan === null) {
    return <p>No athlete seeded. Run `npx prisma db seed`.</p>;
  }

  const todayDay = plan.week.days.find((d) => d.date === plan.today);
  const phase = plan.week.phase;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {plan.today} · {phase}
        {plan.week.isRecoveryWeek ? " · recovery week" : ""}
      </p>
      {todayDay ? (
        <DaySessions day={todayDay} />
      ) : (
        <p className="text-sm text-zinc-500">No sessions scheduled for today.</p>
      )}
    </div>
  );
}
