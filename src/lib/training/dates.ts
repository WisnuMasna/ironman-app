/** Diff in whole local calendar days: later − earlier. */
export function diffCalendarDays(laterIso: string, earlierIso: string): number {
  const [ly, lm, ld] = laterIso.split("-").map(Number);
  const [ey, em, ed] = earlierIso.split("-").map(Number);
  const later = new Date(ly, lm - 1, ld);
  const earlier = new Date(ey, em - 1, ed);
  return Math.round(
    (later.getTime() - earlier.getTime()) / (24 * 60 * 60 * 1000)
  );
}

export function formatDayMonth(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}
