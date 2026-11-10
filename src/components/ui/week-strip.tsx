import Link from "next/link";
import type { DayPlan } from "@/lib/training/sessions";

const DAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];

function sportDotClass(sport: string, isToday: boolean): string {
  if (isToday) return "bg-on-primary";
  switch (sport) {
    case "swim":
      return "bg-swim";
    case "bike":
    case "brick":
      return "bg-bike";
    case "run":
      return "bg-run";
    case "strength":
      return "bg-strength";
    default:
      return "bg-rest";
  }
}

export function WeekStrip({
  days,
  today,
  hrefForDate,
}: {
  days: DayPlan[];
  today: string;
  hrefForDate?: (date: string) => string;
}) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((day, index) => {
        const isToday = day.date === today;
        const dayNum = Number(day.date.slice(-2));
        const sports = [...new Set(day.sessions.map((s) => s.sport))];
        const label = `${DAY_INITIALS[index]} ${dayNum}, ${
          sports.length === 0 ? "rest" : sports.join(" and ")
        }`;
        const className = `flex min-h-tap flex-col items-center justify-center gap-1 rounded-pill px-1 py-2.5 text-center transition-colors duration-[var(--motion-med)] ${
          isToday
            ? "bg-primary text-on-primary shadow-2"
            : "bg-surface text-text shadow-1"
        }`;

        const inner = (
          <>
            <span
              className={`text-caption font-bold ${
                isToday ? "text-on-primary/80" : "text-faint"
              }`}
            >
              {DAY_INITIALS[index]}
            </span>
            <span className="font-numeric text-body font-bold">{dayNum}</span>
            <span className="flex h-2 items-center gap-0.5">
              {sports.length === 0 ? (
                <span
                  className={`h-1.5 w-1.5 rounded-full ring-1 ${
                    isToday ? "ring-on-primary/70" : "ring-border-strong"
                  }`}
                />
              ) : (
                sports.slice(0, 3).map((sport) => (
                  <span
                    key={sport}
                    className={`h-1.5 w-1.5 rounded-full ${sportDotClass(sport, isToday)}`}
                  />
                ))
              )}
            </span>
          </>
        );

        if (hrefForDate) {
          return (
            <Link
              key={day.date}
              href={hrefForDate(day.date)}
              aria-label={label}
              className={className}
            >
              {inner}
            </Link>
          );
        }

        return (
          <div key={day.date} aria-label={label} className={className}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
