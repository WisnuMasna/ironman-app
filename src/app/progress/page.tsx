import { Suspense } from "react";
import { loadWeekPlan } from "@/lib/db/plan";
import { summarizeWeekLoad } from "@/lib/training/load-summary";
import type { PlannedSession } from "@/lib/training/sessions";
import {
  computeLegMetrics,
  getDefaultSub600Splits,
} from "@/lib/training/pacing";
import { formatDurationHms } from "@/lib/training/time";
import { TierBadge } from "@/components/ui/tier-badge";
import { requestNow } from "../request-now";

export default function ProgressPage() {
  return (
    <main className="screen">
      <Suspense fallback={<p className="text-sm text-muted">Loading progress…</p>}>
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
  const swimDone = checkpoints.filter(
    (c) => c.sport === "SWIM" && c.doneDate !== null
  ).length;
  const bikeDone = checkpoints.filter(
    (c) => c.sport === "BIKE" && c.doneDate !== null
  ).length;
  const swimTotal = checkpoints.filter((c) => c.sport === "SWIM").length;
  const bikeTotal = checkpoints.filter((c) => c.sport === "BIKE").length;

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-h1 font-extrabold">Progress</h1>
        <span className="rounded-pill bg-surface-2 px-2.5 py-1 text-caption font-bold text-faint">
          Illustrative data
        </span>
      </header>

      <section className="rounded-lg bg-surface p-4 shadow-1">
        <p className="text-overline font-bold tracking-[0.08em] text-faint uppercase">
          Predicted finish
        </p>
        <p className="mt-1 font-numeric text-display font-bold">
          {predictedSec !== null ? formatDurationHms(predictedSec).slice(0, 4) : "—"}
        </p>
        <p className="text-sm text-muted">
          Stretch split total{" "}
          {predictedSec !== null ? formatDurationHms(predictedSec) : "n/a"} · needs
          FTP/CSS to firm up
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <TierBadge label="Cut-offs" state="on-track" />
          <TierBadge label="Sub-6:30" state="needs-data" />
          <TierBadge label="Sub-6:00" state="needs-data" />
        </div>
        <PredictedTrendChart predictedSec={predictedSec} />
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-bold">Per-leg outlook</h2>
        <div className="grid gap-2">
          <LegRow
            sport="Swim"
            detail="1.9 km · target 0:50"
            state="needs-data"
            tone="swim"
          />
          <LegRow
            sport="Bike"
            detail="90 km · target 3:00 · min 19.8 km/h"
            state="needs-data"
            tone="bike"
          />
          <LegRow
            sport="Run"
            detail="21.1 km · target 1:55 · strongest leg"
            state="on-track"
            tone="run"
          />
        </div>
      </section>

      <section className="space-y-3 rounded-lg bg-surface p-4 shadow-1">
        <h2 className="text-h3 font-bold">Skill checkpoints</h2>
        <CheckpointBar label="Swim" done={swimDone} total={swimTotal} tone="swim" />
        <CheckpointBar label="Bike" done={bikeDone} total={bikeTotal} tone="bike" />
      </section>

      <section className="space-y-3 rounded-lg bg-surface p-4 shadow-1">
        <h2 className="text-h3 font-bold">This week load</h2>
        <p className="text-sm text-muted">
          Planned {summary.plannedHours.toFixed(1)} h · logged{" "}
          {summary.doneHours.toFixed(1)} h · {summary.hardSessionCount} hard
        </p>
        {summary.thresholdBlackHole ? (
          <p className="rounded-md bg-warning-soft px-3 py-2 text-sm text-warning">
            Intensity mix looks like a threshold “black hole” (too much Z3/Z4).
          </p>
        ) : null}
        <ul className="grid gap-2 sm:grid-cols-3">
          {(["swim", "bike", "run"] as const).map((sport) => {
            const row = summary.bySport[sport];
            return (
              <li key={sport} className="rounded-md bg-surface-2 px-3 py-2 capitalize">
                <p className="font-bold">{sport}</p>
                <p className="text-sm text-muted">
                  {row.doneSessions}/{row.plannedSessions} ·{" "}
                  {(row.doneMin / 60).toFixed(1)}/{(row.plannedMin / 60).toFixed(1)} h
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-h3 font-bold">Export</h2>
        <div className="flex flex-wrap gap-3 text-sm font-bold text-primary">
          <a className="underline-offset-2 hover:underline" href="/api/export/ics">
            Calendar (.ics)
          </a>
          <a className="underline-offset-2 hover:underline" href="/api/export/backup">
            Backup JSON
          </a>
          <a className="underline-offset-2 hover:underline" href="/api/export/logs">
            Logs CSV
          </a>
        </div>
      </section>
    </>
  );
}

function LegRow({
  sport,
  detail,
  state,
  tone,
}: {
  sport: string;
  detail: string;
  state: "on-track" | "needs-data";
  tone: "swim" | "bike" | "run";
}) {
  const soft =
    tone === "swim"
      ? "border-l-swim"
      : tone === "bike"
        ? "border-l-bike"
        : "border-l-run";
  return (
    <div className={`rounded-md border-l-4 bg-surface px-4 py-3 shadow-1 ${soft}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold">{sport}</p>
        <TierBadge
          label={state === "on-track" ? "On track" : "Needs data"}
          state={state}
        />
      </div>
      <p className="text-sm text-muted">{detail}</p>
    </div>
  );
}

function CheckpointBar({
  label,
  done,
  total,
  tone,
}: {
  label: string;
  done: number;
  total: number;
  tone: "swim" | "bike";
}) {
  const pct = total === 0 ? 0 : (done / total) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-bold">{label}</span>
        <span className="font-numeric text-muted">
          {done}/{total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-pill bg-surface-2">
        <div
          className={`h-full ${tone === "swim" ? "bg-swim" : "bg-bike"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PredictedTrendChart({ predictedSec }: { predictedSec: number | null }) {
  const minSec = 20000;
  const maxSec = 32000;
  const width = 320;
  const height = 120;
  const x = width - 40;
  const yFor = (sec: number) =>
    height - ((sec - minSec) / (maxSec - minSec)) * (height - 20) - 10;
  const pointY = predictedSec !== null ? yFor(predictedSec) : null;
  const tiers = [
    { label: "8:30", sec: 30600 },
    { label: "6:30", sec: 23400 },
    { label: "6:00", sec: 21600 },
  ];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-4 w-full rounded-md bg-surface-2"
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
            strokeOpacity={0.2}
            strokeDasharray="4 4"
          />
          <text x={24} y={yFor(tier.sec) - 4} fill="currentColor" opacity={0.55} fontSize="10">
            {tier.label}
          </text>
        </g>
      ))}
      {pointY !== null ? (
        <circle cx={x} cy={pointY} r={5} fill="var(--primary)" />
      ) : null}
    </svg>
  );
}
