/**
 * Typed plan mutations for "Why this changed" notes and undo history.
 * SOURCE: PLAN.md §8.7, §6.4 item 7
 */

export type PlanChangeKind =
  | "moved"
  | "shortened"
  | "dropped"
  | "retargeted"
  | "added";

export type PlanChangeSource =
  | "ADAPT"
  | "MISSED"
  | "MODE"
  | "TEST"
  | "USER"
  | "EASE";

export type ReasonCode =
  | "MISSED_KEY_DROPPED"
  | "MISSED_KEY_INTENSITY_SWAPPED"
  | "MISSED_SKIPPED"
  | "MISSED_MOVED"
  | "NEW_FTP_RETARGET"
  | "NEW_CSS_RETARGET"
  | "NEW_RUN_THRESHOLD_RETARGET"
  | "EASE_BACK_VOLUME"
  | "EASE_BACK_NO_Z4"
  | "AVAILABILITY_CAP"
  | "USER_MOVED"
  | "USER_SKIPPED";

export type PlanChange = {
  sessionId: string;
  kind: PlanChangeKind;
  reasonCode: ReasonCode;
  params: Record<string, string | number | boolean | null>;
  source: PlanChangeSource;
};

export type AdaptOk<T> = {
  ok: true;
  value: T;
  changes: PlanChange[];
};

export type AdaptErr = {
  ok: false;
  error: "not-found" | "non-positive-input" | "invalid-date" | "slot-unavailable";
};

export type AdaptOutcome<T> = AdaptOk<T> | AdaptErr;

export function sessionIdFor(date: string, sport: string, index = 0): string {
  return `${date}:${sport}:${index}`;
}

/** Plain-language note from a reason code. SOURCE: DESIGN.md §5.9 ChangeNote */
export function reasonCodeToPlainNote(change: PlanChange): string {
  const p = change.params;
  switch (change.reasonCode) {
    case "MISSED_KEY_DROPPED":
      return "Dropped: a missed key session is never stacked onto the next day.";
    case "MISSED_KEY_INTENSITY_SWAPPED":
      return `Key intensity moved onto ${String(p.toDate ?? "a later easy day")} instead of stacking.`;
    case "MISSED_SKIPPED":
      return "Skipped: session removed from this week.";
    case "MISSED_MOVED":
      return `Moved from ${String(p.fromDate ?? "?")} to ${String(p.toDate ?? "?")}.`;
    case "NEW_FTP_RETARGET":
      return `Bike targets updated after a new FTP test (${String(p.value ?? "?")} W).`;
    case "NEW_CSS_RETARGET":
      return "Swim targets updated after a new CSS test.";
    case "NEW_RUN_THRESHOLD_RETARGET":
      return "Run targets updated after a new threshold test.";
    case "EASE_BACK_VOLUME":
      return `Eased back in: volume cut to ${String(p.volumePct ?? "?")}% after missed days.`;
    case "EASE_BACK_NO_Z4":
      return "Eased back in: hard (Z4+) work removed for the re-entry week.";
    case "AVAILABILITY_CAP":
      return `Shortened to ${String(p.durationMin ?? "?")} min: day time limit.`;
    case "USER_MOVED":
      return `You moved this session to ${String(p.toDate ?? "?")}.`;
    case "USER_SKIPPED":
      return "You skipped this session.";
  }
}
