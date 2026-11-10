import { ChangeNote } from "@/components/ui/change-note";
import { EmptyState } from "@/components/ui/empty-state";
import { PrimaryActionBar } from "@/components/ui/primary-action-bar";
import { RaceCountdown } from "@/components/ui/race-countdown";
import { SessionCard } from "@/components/ui/session-card";
import { TierBadge } from "@/components/ui/tier-badge";
import { WarningBanner } from "@/components/ui/warning-banner";
import { WeekStrip } from "@/components/ui/week-strip";
import { SkillChip, ZoneChip } from "@/components/ui/zone-chip";

const fixtureDays = [
  { date: "2026-11-09", dayOfWeek: 1, sessions: [] },
  {
    date: "2026-11-10",
    dayOfWeek: 2,
    sessions: [
      {
        sport: "swim" as const,
        type: "skill",
        durationMin: 45,
        isHard: false,
        maxZone: null,
        targets: { kind: "skill" as const, checkpointHint: "S0", rpe: 4 },
        outdoor: false,
      },
    ],
  },
  {
    date: "2026-11-11",
    dayOfWeek: 3,
    sessions: [
      {
        sport: "run" as const,
        type: "easy",
        durationMin: 40,
        isHard: false,
        maxZone: "Z2",
        targets: { kind: "zone" as const, zone: "Z2" },
        outdoor: false,
      },
    ],
  },
  { date: "2026-11-12", dayOfWeek: 4, sessions: [] },
  { date: "2026-11-13", dayOfWeek: 5, sessions: [] },
  { date: "2026-11-14", dayOfWeek: 6, sessions: [] },
  { date: "2026-11-15", dayOfWeek: 7, sessions: [] },
];

export default function DevComponentsPage() {
  return (
    <main className="screen space-y-8 pb-24">
      <header className="space-y-1">
        <h1 className="text-h1 font-extrabold">Component gallery</h1>
        <p className="text-sm text-muted">
          Static fixtures for M14 states — light/dark via Settings theme.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-h3 font-bold">Badges & chips</h2>
        <div className="flex flex-wrap gap-2">
          <TierBadge label="Cut-offs" state="on-track" />
          <TierBadge label="Sub-6:30" state="at-risk" />
          <TierBadge label="Sub-6:00" state="needs-data" />
          <ZoneChip zone="Z2" target="5:14–5:55/km" />
          <SkillChip checkpoint="S0" rpe={4} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-bold">Banners</h2>
        <WarningBanner
          headline="No bike yet"
          body="Bike sessions stay indoor until equipment is updated."
          fixHref="/profile"
          fixLabel="Update equipment"
        />
        <ChangeNote note="Dropped: a missed key session is never stacked onto the next day." />
      </section>

      <RaceCountdown
        raceName="70.3 Da Nang"
        raceDateLabel="Sun 9 May 2027"
        daysToGo={180}
        phase="Prep"
        weekInPlan={1}
        totalWeeks={26}
        tiers={[
          { label: "Cut-offs", state: "on-track" },
          { label: "Sub-6:30", state: "needs-data" },
        ]}
      />

      <WeekStrip days={fixtureDays} today="2026-11-10" />

      <section className="space-y-3">
        <h2 className="text-h3 font-bold">Session cards</h2>
        <SessionCard
          session={fixtureDays[1].sessions[0]}
          meta="AM"
          log={null}
        />
        <SessionCard
          session={fixtureDays[2].sessions[0]}
          meta="PM"
          log={{
            id: 1,
            plannedSessionId: null,
            athleteId: 1,
            date: "2026-11-11",
            sport: "RUN",
            durationMin: 40,
            distanceM: null,
            avgPower: null,
            avgPaceSec: null,
            avgHr: null,
            rpe: 4,
            status: "DONE",
            movedToDate: null,
            notes: null,
            heatExposure: false,
          }}
        />
      </section>

      <EmptyState
        title="No trend yet"
        body="Log 3 sessions to see your first predicted-finish trend."
        progress="1/3"
        href="/"
        cta="Go to Today"
      />

      <PrimaryActionBar label="Done as planned" />
    </main>
  );
}
