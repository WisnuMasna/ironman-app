import Link from "next/link";
import { Suspense } from "react";
import { ChangeNoteList } from "@/components/ui/change-note";
import { RaceCountdown } from "@/components/ui/race-countdown";
import { WarningBanner } from "@/components/ui/warning-banner";
import { WeekStrip } from "@/components/ui/week-strip";
import { moveSlotsByDate } from "@/lib/db/move-slots";
import { loadWeekPlan } from "@/lib/db/plan";
import {
  diffCalendarDays,
  formatDayMonth,
  formatLongDate,
  greetingForHour,
} from "@/lib/training/dates";
import { reasonCodeToPlainNote } from "@/lib/training/plan-change";
import { requestNow } from "./request-now";
import { DaySessions } from "./ui/session-list";

const DAY_ISO = /^\d{4}-\d{2}-\d{2}$/;

export default function Home(props: PageProps<"/">) {
  return (
    <main className="screen">
      <Suspense fallback={<p className="text-sm text-muted">Loading today…</p>}>
        <TodayContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function TodayContent({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  const now = await requestNow();
  const plan = await loadWeekPlan(now);
  if (plan === null) {
    return <p>No athlete seeded. Run `npx prisma db seed`.</p>;
  }

  const params = await searchParams;
  const rawDay = typeof params.day === "string" ? params.day : undefined;
  const selectedDate =
    rawDay &&
    DAY_ISO.test(rawDay) &&
    plan.week.days.some((d) => d.date === rawDay)
      ? rawDay
      : plan.today;

  const selectedDay = plan.week.days.find((d) => d.date === selectedDate);
  const isViewingToday = selectedDate === plan.today;
  const sessionCount = selectedDay?.sessions.length ?? 0;
  const totalMin =
    selectedDay?.sessions.reduce((sum, s) => sum + s.durationMin, 0) ?? 0;
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

      <ChangeNoteList
        notes={[
          ...new Set(plan.changes.map((change) => reasonCodeToPlainNote(change))),
        ].slice(0, 3)}
      />

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

      <WeekStrip
        days={plan.week.days}
        today={plan.today}
        selected={selectedDate}
        hrefForDate={(date) =>
          date === plan.today ? "/" : `/?day=${encodeURIComponent(date)}`
        }
      />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-h3 font-bold">
            {isViewingToday ? "Today" : formatDayMonth(selectedDate)}
          </h2>
          <p className="text-sm text-muted">
            {sessionCount} session{sessionCount === 1 ? "" : "s"}
            {totalMin > 0
              ? ` · ${Math.floor(totalMin / 60) > 0 ? `${Math.floor(totalMin / 60)} h ` : ""}${totalMin % 60} min`
              : ""}
          </p>
        </div>
        {selectedDay ? (
          <DaySessions
            day={selectedDay}
            logs={plan.athlete.workoutLogs}
            moveSlotsByDate={moveSlotsByDate(plan.week)}
            showDate={false}
          />
        ) : (
          <p className="text-sm text-muted">No sessions scheduled for this day.</p>
        )}
      </section>
    </>
  );
}
