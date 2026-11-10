import { Suspense } from "react";
import { loadWeekPlan } from "@/lib/db/plan";
import { summarizeWeekLoad } from "@/lib/training/load-summary";
import type { PlannedSession } from "@/lib/training/sessions";
import {
  computeLegMetrics,
  getDefaultSub600Splits,
} from "@/lib/training/pacing";
import { formatDurationHms } from "@/lib/training/time";
import { requestNow } from "../request-now";

export default function ProgressPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading progress…</p>}>
        <ProgressContent />
      </Suspense>
    </main>
  );
}

async function ProgressContent() {
  const plan = await loadWeekPlan(await requestNow());
  if (plan === null) {
    return <p>No athlete seeded. Run `npx prisma db seed`.</p>;
  }

  const weekLogs = plan.athlete.workoutLogs
    .filter(
      (log) =>
        log.date >= plan.weekStartMonday &&
        log.date <= (plan.week.days[6]?.date ?? plan.weekStartMonday)
    )
    .map((log) => ({
      date: log.date,
      sport: log.sport.toLowerCase() as PlannedSession["sport"],
      durationMin: log.durationMin,
      status: log.status as "DONE" | "PARTIAL" | "MISSED",
    }));

  const summary = summarizeWeekLoad({ week: plan.week, logs: weekLogs });
  const splits = getDefaultSub600Splits();
  const metrics = computeLegMetrics(splits);
  const predictedSec = metrics.ok ? metrics.value.totalSec : null;

  const checkpoints = plan.athlete.skillCheckpoints;
  const doneCount = checkpoints.filter((c) => c.doneDate !== null).length;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-medium">This week load</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Planned {summary.plannedHours.toFixed(1)} h ({summary.plannedSessions}{" "}
          sessions) · logged {summary.doneHours.toFixed(1)} h (
          {summary.doneSessions} done, {summary.partialSessions} partial) ·{" "}
          {summary.hardSessionCount} hard
        </p>
        {summary.thresholdBlackHole ? (
          <p className="text-sm text-amber-700">
            Intensity mix looks like a threshold “black hole” (too much Z3/Z4).
          </p>
        ) : null}
        <ul className="grid gap-2 text-sm sm:grid-cols-3">
          {(["swim", "bike", "run"] as const).map((sport) => {
            const row = summary.bySport[sport];
            return (
              <li
                key={sport}
                className="rounded-md border border-zinc-200 px-3 py-2 capitalize dark:border-zinc-700"
              >
                <p className="font-medium">{sport}</p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {row.doneSessions}/{row.plannedSessions} sessions ·{" "}
                  {(row.doneMin / 60).toFixed(1)}/
                  {(row.plannedMin / 60).toFixed(1)} h
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Predicted A-race finish</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Current stretch split total:{" "}
          {predictedSec !== null ? formatDurationHms(predictedSec) : "n/a"}
        </p>
        <PredictedTrendChart predictedSec={predictedSec} />
        <p className="text-xs text-zinc-500">
          Tier lines: cut-offs 8:30 · sub-6:30 · sub-6:00. Trend points will fill
          in as new estimates and B-race results are logged.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Skill checkpoints</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {doneCount}/{checkpoints.length} done
        </p>
        <ul className="space-y-1 text-sm">
          {checkpoints.map((c) => (
            <li key={c.code}>
              <span className="font-medium">{c.code}</span> · target {c.targetDate}
              {c.doneDate ? ` · done ${c.doneDate}` : " · open"}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Export</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <a className="underline" href="/api/export/ics">
            Download calendar (.ics)
          </a>
          <a className="underline" href="/api/export/backup">
            Backup JSON
          </a>
          <a className="underline" href="/api/export/logs">
            Logs CSV
          </a>
        </div>
      </section>
    </div>
  );
}

function PredictedTrendChart({ predictedSec }: { predictedSec: number | null }) {
  const tiers = [
    { label: "8:30", sec: 30600, y: 20 },
    { label: "6:30", sec: 23400, y: 55 },
    { label: "6:00", sec: 21600, y: 70 },
  ];
  const minSec = 20000;
  const maxSec = 32000;
  const width = 320;
  const height = 120;
  const x = width - 40;
  const yFor = (sec: number) =>
    height - ((sec - minSec) / (maxSec - minSec)) * (height - 20) - 10;
  const pointY = predictedSec !== null ? yFor(predictedSec) : null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-md rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
      role="img"
      aria-label="Predicted finish versus goal tiers"
    >
      {tiers.map((tier) => (
        <g key={tier.label}>
          <line
            x1={20}
            x2={width - 20}
            y1={yFor(tier.sec)}
            y2={yFor(tier.sec)}
            stroke="currentColor"
            strokeOpacity={0.25}
          />
          <text
            x={24}
            y={yFor(tier.sec) - 4}
            className="fill-zinc-500"
            fontSize="10"
          >
            {tier.label}
          </text>
        </g>
      ))}
      {pointY !== null ? (
        <circle cx={x} cy={pointY} r={5} className="fill-zinc-900 dark:fill-zinc-100" />
      ) : null}
    </svg>
  );
}
