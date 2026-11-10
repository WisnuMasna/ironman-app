import type { WorkoutLog } from "@prisma/client";
import type { PlannedSession } from "@/lib/training/sessions";
import { IconChevron } from "../icons";
import { SportIcon, sportFillClass, sportStripeClass } from "./sport";

function targetLabel(session: PlannedSession): string {
  if (session.targets.kind === "skill") {
    return `Skill · ${session.targets.checkpointHint} · RPE ${session.targets.rpe}`;
  }
  return `${session.targets.zone}`;
}

function statusLabel(log: WorkoutLog | null): string | null {
  if (log === null) return null;
  if (log.movedToDate === "skip") return "Skipped";
  if (log.movedToDate) return `Moved to ${log.movedToDate}`;
  return log.status.charAt(0) + log.status.slice(1).toLowerCase();
}

export function SessionCard({
  session,
  meta,
  log,
  compact = false,
}: {
  session: PlannedSession;
  meta: string;
  log: WorkoutLog | null;
  compact?: boolean;
}) {
  const title =
    session.sport === "bike" && session.outdoor
      ? "Outdoor ride"
      : session.sport === "bike" && session.type === "spin"
        ? "Spin bridge"
        : session.type === "skill" || session.targets.kind === "skill"
          ? `${session.sport.charAt(0).toUpperCase()}${session.sport.slice(1)} lesson`
          : `${session.type.charAt(0).toUpperCase()}${session.type.slice(1)} ${session.sport}`;

  const status = statusLabel(log);
  const muted = log?.status === "DONE" || log?.status === "MISSED";

  return (
    <article
      className={`relative overflow-hidden rounded-md bg-surface shadow-1 ${
        compact ? "p-3" : "p-4"
      } ${muted ? "opacity-80" : ""}`}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${sportStripeClass(session.sport)}`} />
      <div className="flex items-start gap-3 pl-2">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${sportFillClass(session.sport)}`}
        >
          <SportIcon sport={session.sport} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-body font-bold ${log?.status === "MISSED" ? "line-through" : ""}`}>
              {title}
            </h3>
            <IconChevron className="mt-0.5 shrink-0 text-faint" />
          </div>
          <p className="text-sm text-muted">
            {meta} · {session.durationMin} min
            {session.outdoor ? " · Outdoor" : session.sport === "bike" ? " · Indoor" : ""}
            {session.isHard ? " · Key" : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span
              className={`inline-flex items-center rounded-pill px-2 py-0.5 text-caption font-bold ${
                session.targets.kind === "skill"
                  ? "bg-swim-soft text-swim-ink"
                  : "bg-surface-2 text-muted"
              }`}
            >
              {session.targets.kind === "skill" ? (
                <>Skill · {session.targets.checkpointHint}</>
              ) : (
                <>
                  <span
                    className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
                      session.targets.zone === "Z1"
                        ? "bg-z1"
                        : session.targets.zone === "Z2"
                          ? "bg-z2"
                          : session.targets.zone === "Z3"
                            ? "bg-z3"
                            : session.targets.zone === "Z4"
                              ? "bg-z4"
                              : "bg-z5"
                    }`}
                  />
                  {targetLabel(session)}
                </>
              )}
            </span>
            {status ? (
              <span className="text-caption font-bold text-faint">{status}</span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
