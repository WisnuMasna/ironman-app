import Link from "next/link";
import { Suspense } from "react";
import { SkillChip, ZoneChip } from "@/components/ui/zone-chip";
import {
  SportIcon,
  sportCardSoftClass,
  sportFillClass,
} from "@/components/ui/sport";
import { IconChevron } from "@/components/icons";
import { saveWorkoutLog } from "@/app/actions";
import { requestNow } from "@/app/request-now";
import { loadWeekPlan } from "@/lib/db/plan";
import { formatDayMonth, formatLongDate } from "@/lib/training/dates";
import { buildSessionPurpose } from "@/lib/training/session-purpose";

export default function SessionPage(
  props: PageProps<"/session/[date]/[index]">
) {
  return (
    <main className="screen">
      <Suspense fallback={<p className="text-sm text-muted">Loading session…</p>}>
        <SessionContent params={props.params} />
      </Suspense>
    </main>
  );
}

async function SessionContent({
  params,
}: {
  params: PageProps<"/session/[date]/[index]">["params"];
}) {
  const { date, index: indexRaw } = await params;
  const index = Number(indexRaw);
  const plan = await loadWeekPlan(await requestNow());
  if (plan === null) {
    return <p>No athlete seeded. Run `npx prisma db seed`.</p>;
  }

  const day = plan.week.days.find((d) => d.date === date);
  const session = day?.sessions[index];
  if (!day || !session || !Number.isInteger(index) || index < 0) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-sm text-muted">Session not found for {date}.</p>
      </div>
    );
  }

  const firstName = plan.athlete.name.split(" ")[0] ?? plan.athlete.name;
  const purpose = buildSessionPurpose({
    session,
    athleteFirstName: firstName,
    phase: plan.week.phase,
  });
  const log =
    plan.athlete.workoutLogs.find(
      (row) =>
        row.date === date && row.sport.toLowerCase() === session.sport
    ) ?? null;
  const alreadyLogged = log !== null && log.status === "DONE";
  const backHref = date === plan.today ? "/" : `/?day=${encodeURIComponent(date)}`;

  return (
    <>
      <BackLink href={backHref} />

      <section
        className={`relative overflow-hidden rounded-lg p-4 shadow-1 ${sportCardSoftClass(session.sport)}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md ${sportFillClass(session.sport)}`}
          >
            <SportIcon sport={session.sport} className="h-6 w-6 text-on-sport" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-overline font-bold tracking-[0.08em] text-faint uppercase">
              {formatDayMonth(date)} · {plan.week.phase}
              {session.outdoor ? " · Outdoor" : session.sport === "bike" ? " · Indoor" : ""}
              {session.isHard ? " · Key" : ""}
            </p>
            <h1 className="text-h2 font-extrabold text-text">{purpose.title}</h1>
            <p className="text-sm text-muted">{purpose.headline}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {session.targets.kind === "skill" ? (
                <SkillChip
                  checkpoint={session.targets.checkpointHint}
                  rpe={session.targets.rpe}
                />
              ) : (
                <ZoneChip zone={session.targets.zone} />
              )}
              <span className="rounded-pill bg-surface px-2.5 py-1 text-caption font-bold text-muted shadow-1">
                {session.durationMin} min
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-lg bg-surface p-4 shadow-1">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-pill bg-primary-soft text-sm font-extrabold text-primary">
            Coach
          </div>
          <div>
            <p className="font-bold text-text">Why this session</p>
            <p className="text-caption text-muted">
              Plain words · what you get from showing up
            </p>
          </div>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          {purpose.why.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
        <p className="rounded-md bg-surface-2 px-3 py-2 text-sm font-bold text-text">
          {purpose.effortCue}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-bold">How it breaks down</h2>
        <ol className="space-y-2">
          {purpose.steps.map((step, stepIndex) => (
            <li
              key={`${step.name}-${stepIndex}`}
              className="flex gap-3 rounded-md bg-surface px-3 py-3 shadow-1"
            >
              <span className="font-numeric text-caption font-bold text-faint">
                {String(stepIndex + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-bold text-text">{step.name}</p>
                  <p className="font-numeric text-sm text-muted">
                    {step.durationMin} min
                  </p>
                </div>
                <p className="text-sm text-muted">{step.cue}</p>
                {step.zone ? <ZoneChip zone={step.zone} plain={false} /> : null}
                {step.skill ? <SkillChip checkpoint={step.skill} /> : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-caption text-faint">{formatLongDate(date)}</p>

      {alreadyLogged ? (
        <p className="rounded-md bg-success-soft px-4 py-3 text-sm font-bold text-success">
          Logged as done
        </p>
      ) : (
        <form action={saveWorkoutLog} className="sticky bottom-[5.5rem] z-30 space-y-0">
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="sport" value={session.sport} />
          <input type="hidden" name="durationMin" value={session.durationMin} />
          <input type="hidden" name="status" value="DONE" />
          <button
            type="submit"
            className="flex min-h-tap w-full items-center justify-center rounded-pill bg-primary px-4 text-body font-bold text-on-primary shadow-2"
          >
            Done as planned
          </button>
        </form>
      )}
    </>
  );
}

function BackLink({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-tap items-center gap-1 text-sm font-bold text-primary"
    >
      <span className="rotate-180">
        <IconChevron className="h-4 w-4" />
      </span>
      Back
    </Link>
  );
}
