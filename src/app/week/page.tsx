import { Suspense } from "react";
import { moveSlotsByDate } from "@/lib/db/move-slots";
import { loadWeekPlan } from "@/lib/db/plan";
import { summarizeWeekLoad } from "@/lib/training/load-summary";
import type { PlannedSession } from "@/lib/training/sessions";
import { formatDayMonth } from "@/lib/training/dates";
import { requestNow } from "../request-now";
import { DaySessions } from "../ui/session-list";
import { WarningBanner } from "@/components/ui/warning-banner";

export default function WeekPage() {
  return (
    <main className="screen">
      <Suspense fallback={<p className="text-sm text-muted">Loading plan…</p>}>
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

  const end = plan.week.days[6]?.date ?? plan.weekStartMonday;
  const weekLogs = plan.athlete.workoutLogs
    .filter((log) => log.date >= plan.weekStartMonday && log.date <= end)
    .map((log) => ({
      date: log.date,
      sport: log.sport.toLowerCase() as PlannedSession["sport"],
      durationMin: log.durationMin,
      status: log.status as "DONE" | "PARTIAL" | "MISSED",
    }));
  const summary = summarizeWeekLoad({ week: plan.week, logs: weekLogs });
  const swimH = summary.bySport.swim.plannedMin / 60;
  const bikeH = summary.bySport.bike.plannedMin / 60;
  const runH = summary.bySport.run.plannedMin / 60;
  const totalH = summary.plannedHours || 1;

  return (
    <>
      <header className="space-y-3">
        <h1 className="text-h1 font-extrabold">Plan</h1>
        <div className="flex rounded-pill bg-surface-2 p-1 text-sm font-bold">
          <span className="flex-1 rounded-pill bg-surface px-3 py-2 text-center text-primary shadow-2">
            Week
          </span>
          <span className="flex-1 px-3 py-2 text-center text-faint">Month</span>
          <span className="flex-1 px-3 py-2 text-center text-faint">Phases</span>
        </div>
      </header>

      {plan.checkpointWarning === "checkpoint-past-peak" ? (
        <WarningBanner
          variant="danger"
          headline="Checkpoint past Peak"
          body="A slipped skill checkpoint would push S6 or B7 past Peak week."
          fixHref="/profile"
          fixLabel="Review checkpoints"
        />
      ) : null}

      <section className="space-y-3 rounded-lg bg-surface p-4 shadow-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-h3 font-bold">
            Week · {formatDayMonth(plan.weekStartMonday)} – {formatDayMonth(end)}
          </h2>
          <span className="rounded-pill bg-primary-soft px-2.5 py-1 text-caption font-bold text-primary">
            {plan.week.phase}
          </span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-pill bg-surface-2">
          <div
            className="bg-swim"
            style={{ width: `${(swimH / totalH) * 100}%` }}
            title={`Swim ${swimH.toFixed(1)} h`}
          />
          <div
            className="bg-bike"
            style={{ width: `${(bikeH / totalH) * 100}%` }}
            title={`Bike ${bikeH.toFixed(1)} h`}
          />
          <div
            className="bg-run"
            style={{ width: `${(runH / totalH) * 100}%` }}
            title={`Run ${runH.toFixed(1)} h`}
          />
        </div>
        <p className="text-sm text-muted">
          <span className="text-swim-ink">Swim {swimH.toFixed(1)} h</span>
          {" · "}
          <span className="text-bike-ink">Bike {bikeH.toFixed(1)} h</span>
          {" · "}
          <span className="text-run-ink">Run {runH.toFixed(1)} h</span>
          {" · "}
          <span className="font-numeric font-bold text-text">
            {summary.plannedHours.toFixed(1)} h total
          </span>
        </p>
        <p className="text-caption text-faint">
          {plan.athlete.hasBike ? "Outdoor bike allowed" : "Indoor bike bridge"} · bike{" "}
          {plan.athlete.bikeStatus.toLowerCase()}
          {plan.week.isRecoveryWeek ? " · recovery week" : ""}
        </p>
      </section>

      <div className="space-y-5">
        {plan.week.days.map((day) => (
          <DaySessions
            key={day.date}
            day={day}
            logs={plan.athlete.workoutLogs}
            moveSlotsByDate={moveSlotsByDate(plan.week)}
            compact
          />
        ))}
      </div>
    </>
  );
}
