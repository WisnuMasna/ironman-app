import type { PlannedSession } from "./sessions";

export type IcsEvent = {
  date: string; // YYYY-MM-DD local calendar date
  startHourLocal: number;
  session: PlannedSession;
};

export type IcsInput = {
  calendarName: string;
  timezone: string;
  events: IcsEvent[];
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function sessionSummary(session: PlannedSession): string {
  if (session.targets.kind === "zone") {
    return `${session.sport} · ${session.type} · ${session.targets.zone}`;
  }
  return `${session.sport} · ${session.type} · skill`;
}

function sessionDescription(session: PlannedSession): string {
  if (session.targets.kind === "zone") {
    return `zone ${session.targets.zone} · ${session.durationMin} min`;
  }
  return `skill ${session.targets.checkpointHint} · RPE ${session.targets.rpe} · ${session.durationMin} min`;
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let remaining = line;
  parts.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 0) {
    parts.push(` ${remaining.slice(0, 74)}`);
    remaining = remaining.slice(74);
  }
  return parts.join("\r\n");
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Build an iCalendar document (one VEVENT per session).
 * SOURCE: PLAN.md §6.2 calendar export (.ics)
 */
export function buildIcsCalendar(input: IcsInput): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ironman-app//training//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(input.calendarName)}`,
    `X-WR-TIMEZONE:${escapeText(input.timezone)}`,
  ];

  for (const event of input.events) {
    const [y, m, d] = event.date.split("-").map(Number);
    const startH = event.startHourLocal;
    const durationMin = event.session.durationMin;
    const endTotalMin = startH * 60 + durationMin;
    const endH = Math.floor(endTotalMin / 60);
    const endM = endTotalMin % 60;

    const dtStart = `${y}${pad(m)}${pad(d)}T${pad(startH)}0000`;
    const dtEnd = `${y}${pad(m)}${pad(d)}T${pad(endH)}${pad(endM)}00`;
    const uid = `${event.date}-${event.session.sport}-${event.session.type}@ironman-app`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtStart}Z`);
    lines.push(`DTSTART;TZID=${input.timezone}:${dtStart}`);
    lines.push(`DTEND;TZID=${input.timezone}:${dtEnd}`);
    lines.push(foldLine(`SUMMARY:${escapeText(sessionSummary(event.session))}`));
    lines.push(
      foldLine(`DESCRIPTION:${escapeText(sessionDescription(event.session))}`)
    );
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
