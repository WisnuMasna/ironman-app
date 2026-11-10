import Link from "next/link";
import { Suspense } from "react";
import { RaceCountdown } from "@/components/ui/race-countdown";
import { WarningBanner } from "@/components/ui/warning-banner";
import { WeekStrip } from "@/components/ui/week-strip";
import { moveSlotsByDate } from "@/lib/db/move-slots";
import { loadWeekPlan } from "@/lib/db/plan";
import {
  diffCalendarDays,
  formatLongDate,
  greetingForHour,
} from "@/lib/training/dates";
import { requestNow } from "./request-now";
import { DaySessions } from "./ui/session-list";

export default function Home() {
  return (
    <main className="screen">
      <Suspense fallback={<p className="text-sm text-muted">Loading today…</p>}>
        <TodayContent />
      </Suspense>
    </main>
  );
}

async function TodayContent() {
  const now = await requestNow();
  const plan = await loadWeekPlan(now);
  if (plan === null) {
    return <p>No athlete seeded. Run `npx prisma db seed`.</p>;
  }

  const todayDay = plan.week.days.find((d) => d.date === plan.today);
  const sessionCount = todayDay?.sessions.length ?? 0;
  const totalMin =
    todayDay?.sessions.reduce((sum, s) => sum + s.durationMin, 0) ?? 0;
  const daysToGo = Math.max(0, diffCalendarDays(plan.raceDate, plan.today));
  const totalWeeks = Math.max(
    1,
    Math.ceil(diffCalendarDays(plan.raceDate, plan.weekStartMonday) / 7) + 1
  );
  const weekInPlan = Math.max(
    1,
    totalWeeks -
      Math.ceil(diffCalendarDays(plan.raceDate, plan.weekStartMonday) / 7)
  );
  const hour = Number(
    new Intl.DateTimeFormat("en-AU", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "numeric",
      hour12: false,
    }).format(now)
  );
  const greeting = greetingForHour(hour);
  const firstName = plan.athlete.name.split(" ")[0] ?? plan.athlete.name;

  return (
    <>
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-overline font-bold tracking-[0.08em] text-faint uppercase">
            {formatLongDate(plan.today)}
          </p>
          <h1 className="text-h1 font-extrabold">
            {greeting}, {firstName}
          </h1>
        </div>
        <Link
          href="/profile"
          className="flex h-11 w-11 items-center justify-center rounded-pill bg-primary-soft text-sm font-bold text-primary"
          aria-label="Settings"
        >
          {firstName.slice(0, 1).toUpperCase()}
        </Link>
      </header>

      {!plan.athlete.hasBike ? (
        <WarningBanner
          variant="warn"
          headline="No bike yet"
          body="Bike sessions stay as indoor spin bridges until you buy a bike and complete a professional fit."
          fixHref="/profile"
          fixLabel="Update equipment"
        />
      ) : null}

      {plan.repeatNextLoadWeek ? (
        <WarningBanner
          variant="warn"
          headline="Low weekly compliance"
          body="The next load week will repeat instead of progressing. Log sessions or adjust the plan."
          fixHref="/week"
          fixLabel="Review this week"
        />
      ) : null}

      <RaceCountdown
        raceName="70.3 Da Nang"
        raceDateLabel={formatLongDate(plan.raceDate)}
        daysToGo={daysToGo}
        phase={plan.week.phase}
        weekInPlan={weekInPlan}
        totalWeeks={totalWeeks}
        tiers={[
          { label: "Cut-offs", state: "on-track" },
          { label: "Sub-6:30", state: "needs-data" },
          { label: "Sub-6:00", state: "needs-data" },
        ]}
      />

      <WeekStrip days={plan.week.days} today={plan.today} />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-h3 font-bold">Today</h2>
          <p className="text-sm text-muted">
            {sessionCount} session{sessionCount === 1 ? "" : "s"}
            {totalMin > 0 ? ` · ${Math.floor(totalMin / 60) > 0 ? `${Math.floor(totalMin / 60)} h ` : ""}${totalMin % 60} min` : ""}
          </p>
        </div>
        {todayDay ? (
          <DaySessions
            day={todayDay}
            logs={plan.athlete.workoutLogs}
            moveSlotsByDate={moveSlotsByDate(plan.week)}
            showDate={false}
          />
        ) : (
          <p className="text-sm text-muted">No sessions scheduled for today.</p>
        )}
      </section>
    </>
  );
}
