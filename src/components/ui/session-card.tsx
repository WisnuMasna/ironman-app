import Link from "next/link";
import type { WorkoutLog } from "@prisma/client";
import type { PlannedSession } from "@/lib/training/sessions";
import { sessionTitle } from "@/lib/training/session-purpose";
import { IconChevron } from "../icons";
import { SkillChip, ZoneChip } from "./zone-chip";
import {
  SportIcon,
  sportCardSoftClass,
  sportFillClass,
  sportStripeClass,
} from "./sport";

function statusLabel(log: WorkoutLog | null): string | null {
  if (log === null) return null;
  if (log.movedToDate === "skip") return "Skipped";
  if (log.movedToDate) return `Moved to ${log.movedToDate}`;
  return log.status.charAt(0) + log.status.slice(1).toLowerCase();
}

function skillLabel(hint: string): string {
  if (/^S\d$/i.test(hint) || /^B\d$/i.test(hint)) return hint.toUpperCase();
  if (hint.includes("swim")) return "S0";
  if (hint.includes("bike")) return "B0";
  return hint;
}

export function SessionCard({
  session,
  meta,
  log,
  compact = false,
  href,
}: {
  session: PlannedSession;
  meta: string;
  log: WorkoutLog | null;
  compact?: boolean;
  href?: string;
}) {
  const title = sessionTitle(session);
  const status = statusLabel(log);
  const muted = log?.status === "DONE" || log?.status === "MISSED";
  const softCard = compact ? sportCardSoftClass(session.sport) : "bg-surface";

  const body = (
    <>
      <div
        className={`absolute inset-y-0 left-0 w-1 ${sportStripeClass(session.sport)}`}
        aria-hidden
      />
      <div className="flex items-start gap-3 pl-2">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${sportFillClass(session.sport)}`}
        >
          <SportIcon sport={session.sport} className="h-5 w-5 text-on-sport" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-body font-bold text-text ${
                log?.status === "MISSED" ? "line-through" : ""
              }`}
            >
              {title}
            </h3>
            <IconChevron className="mt-0.5 shrink-0 text-faint" />
          </div>
          <p className="text-sm text-muted">
            {meta} · {session.durationMin} min
            {session.outdoor
              ? " · Outdoor"
              : session.sport === "bike"
                ? " · Indoor"
                : ""}
            {session.isHard ? " · Key" : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {session.targets.kind === "skill" ? (
              <SkillChip checkpoint={skillLabel(session.targets.checkpointHint)} />
            ) : (
              <ZoneChip zone={session.targets.zone} plain={!compact} />
            )}
            {status ? (
              <span className="text-caption font-bold text-faint">{status}</span>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );

  const className = `relative block overflow-hidden rounded-md shadow-1 ${softCard} ${
    compact ? "p-3" : "p-4"
  } ${muted ? "opacity-90" : ""}`;

  if (href) {
    return (
      <Link href={href} className={className} aria-label={`${title}, open details`}>
        {body}
      </Link>
    );
  }

  return <article className={className}>{body}</article>;
}
