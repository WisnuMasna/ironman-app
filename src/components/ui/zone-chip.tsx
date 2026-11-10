const PLAIN: Record<string, string> = {
  Z1: "Very easy, recovery",
  Z2: "Easy, can chat",
  Z3: "Steady, short sentences",
  Z4: "Hard, a few words",
  Z5: "Very hard, can't talk",
  Z5a: "Very hard, can't talk",
  Z5b: "Very hard, can't talk",
  Z5c: "Very hard, can't talk",
};

function zoneTone(zone: string): { soft: string; ink: string; dot: string } {
  if (zone.startsWith("Z1")) {
    return { soft: "bg-z1-soft", ink: "text-muted", dot: "bg-z1" };
  }
  if (zone.startsWith("Z2")) {
    return { soft: "bg-z2-soft", ink: "text-success", dot: "bg-z2" };
  }
  if (zone.startsWith("Z3")) {
    return { soft: "bg-z3-soft", ink: "text-warning", dot: "bg-z3" };
  }
  if (zone.startsWith("Z4")) {
    return { soft: "bg-z4-soft", ink: "text-heat", dot: "bg-z4" };
  }
  return { soft: "bg-z5-soft", ink: "text-danger", dot: "bg-z5" };
}

export function ZoneChip({
  zone,
  target,
  plain = true,
}: {
  zone: string;
  target?: string;
  plain?: boolean;
}) {
  const tone = zoneTone(zone);
  const plainLabel = PLAIN[zone] ?? zone;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-caption font-bold ${tone.soft} ${tone.ink}`}
    >
      <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden />
      {zone}
      {plain ? <span className="font-normal text-faint">· {plainLabel}</span> : null}
      {target ? <span className="font-numeric font-normal">· {target}</span> : null}
    </span>
  );
}

export function SkillChip({
  checkpoint,
  rpe,
}: {
  checkpoint: string;
  rpe?: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-z-skill-soft px-2.5 py-1 text-caption font-bold text-swim-ink">
      Skill · {checkpoint}
      {rpe !== undefined ? <span className="font-normal">· RPE {rpe}</span> : null}
    </span>
  );
}
