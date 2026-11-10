import type { PhaseName } from "@/lib/training/phases";
import { TierBadge, type TierState } from "./tier-badge";
import { IconFlag } from "../icons";

const PHASES: PhaseName[] = ["Prep", "Base", "Build", "Peak", "Taper"];

export function RaceCountdown({
  raceName,
  raceDateLabel,
  daysToGo,
  phase,
  weekInPlan,
  totalWeeks,
  tiers,
}: {
  raceName: string;
  raceDateLabel: string;
  daysToGo: number;
  phase: PhaseName;
  weekInPlan: number;
  totalWeeks: number;
  tiers: Array<{ label: string; state: TierState }>;
}) {
  const activeIndex = PHASES.indexOf(phase);

  return (
    <section className="rounded-lg bg-surface p-4 shadow-1">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-overline font-bold tracking-[0.08em] text-faint uppercase">
            A race · {raceName}
          </p>
          <p className="font-numeric text-display font-bold text-text">
            {daysToGo}
            <span className="ml-2 text-h3 font-bold text-muted">days to go</span>
          </p>
          <p className="text-sm text-muted">{raceDateLabel}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-on-primary">
          <IconFlag />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex h-2.5 overflow-hidden rounded-pill bg-surface-2">
          {PHASES.map((name, index) => (
            <div
              key={name}
              className={`h-full flex-1 ${
                index < activeIndex
                  ? "bg-primary/70"
                  : index === activeIndex
                    ? "bg-primary"
                    : "bg-transparent"
              } ${index > 0 ? "border-l-2 border-surface" : ""}`}
              title={name}
            />
          ))}
        </div>
        <div className="flex justify-between text-caption text-faint">
          {PHASES.map((name) => (
            <span key={name} className={name === phase ? "font-bold text-primary" : ""}>
              {name}
            </span>
          ))}
        </div>
        <p className="text-sm text-muted">
          {phase} · week {weekInPlan} of {totalWeeks}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {tiers.map((tier) => (
          <TierBadge key={tier.label} label={tier.label} state={tier.state} />
        ))}
      </div>
    </section>
  );
}
