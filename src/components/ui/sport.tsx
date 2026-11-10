import type { PlannedSession } from "@/lib/training/sessions";
import {
  IconBike,
  IconMoon,
  IconRun,
  IconStrength,
  IconSwim,
} from "../icons";

export type SportKey = PlannedSession["sport"] | "rest";

export function sportLabel(sport: SportKey): string {
  if (sport === "rest") return "Rest";
  return sport.charAt(0).toUpperCase() + sport.slice(1);
}

export function sportSoftClass(sport: SportKey): string {
  switch (sport) {
    case "swim":
      return "bg-swim-soft text-swim-ink";
    case "bike":
      return "bg-bike-soft text-bike-ink";
    case "run":
      return "bg-run-soft text-run-ink";
    case "brick":
      return "bg-bike-soft text-bike-ink";
    case "strength":
      return "bg-strength-soft text-strength-ink";
    case "rest":
      return "bg-surface-2 text-muted";
  }
}

/** Card fill only — keep title/meta on --text / --text-muted. */
export function sportCardSoftClass(sport: SportKey): string {
  switch (sport) {
    case "swim":
      return "bg-swim-soft";
    case "bike":
      return "bg-bike-soft";
    case "run":
      return "bg-run-soft";
    case "brick":
      return "bg-bike-soft";
    case "strength":
      return "bg-strength-soft";
    case "rest":
      return "bg-surface-2";
  }
}

export function sportStripeClass(sport: SportKey): string {
  switch (sport) {
    case "swim":
      return "bg-swim";
    case "bike":
      return "bg-bike";
    case "run":
      return "bg-run";
    case "brick":
      return "bg-gradient-to-b from-bike to-run";
    case "strength":
      return "bg-strength";
    case "rest":
      return "bg-rest";
  }
}

export function sportFillClass(sport: SportKey): string {
  switch (sport) {
    case "swim":
      return "bg-swim text-on-sport";
    case "bike":
      return "bg-bike text-on-sport";
    case "run":
      return "bg-run text-on-sport";
    case "brick":
      return "bg-gradient-to-br from-bike to-run text-on-sport";
    case "strength":
      return "bg-strength text-on-sport";
    case "rest":
      return "bg-rest text-on-sport";
  }
}

export function SportIcon({
  sport,
  className,
}: {
  sport: SportKey;
  className?: string;
}) {
  switch (sport) {
    case "swim":
      return <IconSwim className={className} />;
    case "bike":
      return <IconBike className={className} />;
    case "run":
      return <IconRun className={className} />;
    case "brick":
      return <IconBike className={className} />;
    case "strength":
      return <IconStrength className={className} />;
    case "rest":
      return <IconMoon className={className} />;
  }
}
