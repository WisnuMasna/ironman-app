"use client";

import { useState } from "react";
import type { WorkoutLog } from "@prisma/client";
import { SessionCard } from "@/components/ui/session-card";
import { SportIcon } from "@/components/ui/sport";
import { saveWorkoutLog } from "../actions";
import type { DayPlan, PlannedSession } from "@/lib/training/sessions";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function logKey(date: string, sport: string): string {
  return `${date}|${sport}`;
}

export function SessionCardWithLog({
  session,
  date,
  log,
  moveSlots,
  meta,
  compact = false,
}: {
  session: PlannedSession;
  date: string;
  log: WorkoutLog | null;
  moveSlots: string[];
  meta: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState(log?.status ?? "DONE");
  const [missAction, setMissAction] = useState<"skip" | "move">("skip");
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <SessionCard session={session} meta={meta} log={log} compact={compact} />
      </button>
      {open ? (
        <form
          action={saveWorkoutLog}
          className="space-y-3 rounded-md bg-surface-2 p-3 text-sm"
        >
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="sport" value={session.sport} />
          <input type="hidden" name="durationMin" value={session.durationMin} />
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex min-w-[7rem] flex-1 flex-col gap-1">
              <span className="text-caption font-bold text-faint">Status</span>
              <select
                name="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "DONE" | "PARTIAL" | "MISSED")
                }
                className="min-h-tap rounded-sm border border-border-strong bg-surface px-2 py-2"
              >
                <option value="DONE">Done</option>
                <option value="PARTIAL">Partial</option>
                <option value="MISSED">Missed</option>
              </select>
            </label>
            <label className="flex w-20 flex-col gap-1">
              <span className="text-caption font-bold text-faint">RPE</span>
              <input
                type="number"
                name="rpe"
                min={1}
                max={10}
                defaultValue={log?.rpe ?? ""}
                className="min-h-tap rounded-sm border border-border-strong bg-surface px-2 py-2 font-numeric"
              />
            </label>
          </div>
          {status === "MISSED" ? (
            <div className="flex flex-wrap gap-2">
              <label className="flex min-w-[8rem] flex-1 flex-col gap-1">
                <span className="text-caption font-bold text-faint">Missed action</span>
                <select
                  name="missAction"
                  value={missAction}
                  onChange={(e) =>
                    setMissAction(e.target.value === "move" ? "move" : "skip")
                  }
                  className="min-h-tap rounded-sm border border-border-strong bg-surface px-2 py-2"
                >
                  <option value="skip">Skip (drop)</option>
                  <option value="move" disabled={moveSlots.length === 0}>
                    Move within week
                  </option>
                </select>
              </label>
              {missAction === "move" && moveSlots.length > 0 ? (
                <label className="flex min-w-[8rem] flex-1 flex-col gap-1">
                  <span className="text-caption font-bold text-faint">Move to</span>
                  <select
                    name="moveToDate"
                    className="min-h-tap rounded-sm border border-border-strong bg-surface px-2 py-2"
                    defaultValue={moveSlots[0]}
                  >
                    {moveSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          ) : null}
          <button
            type="submit"
            className="flex min-h-tap w-full items-center justify-center rounded-pill bg-primary px-4 text-body font-bold text-on-primary"
          >
            Log session
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function DaySessions({
  day,
  logs,
  moveSlotsByDate,
  showDate = true,
  compact = false,
}: {
  day: DayPlan;
  logs: WorkoutLog[];
  moveSlotsByDate?: Record<string, string[]>;
  showDate?: boolean;
  compact?: boolean;
}) {
  const name = DAY_NAMES[day.dayOfWeek - 1] ?? "";
  const byKey = new Map(
    logs.map((log) => [logKey(log.date, log.sport.toLowerCase()), log])
  );

  if (day.sessions.length === 0) {
    return (
      <section className="space-y-2">
        {showDate ? (
          <h3 className="text-sm font-bold text-muted">
            {name} {day.date}
          </h3>
        ) : null}
        <div className="flex items-center gap-3 rounded-md bg-surface px-4 py-4 shadow-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-surface-2 text-muted">
            <SportIcon sport="rest" />
          </div>
          <div>
            <p className="font-bold">Rest day</p>
            <p className="text-sm text-muted">Recovery is part of the plan.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      {showDate ? (
        <h3 className="text-sm font-bold text-muted">
          {name} {day.date}
        </h3>
      ) : null}
      <ul className="space-y-2">
        {day.sessions.map((session, index) => (
          <li key={`${day.date}-${session.sport}-${index}`}>
            <SessionCardWithLog
              session={session}
              date={day.date}
              log={byKey.get(logKey(day.date, session.sport)) ?? null}
              moveSlots={moveSlotsByDate?.[day.date] ?? []}
              meta={index === 0 ? "AM" : "PM"}
              compact={compact}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
