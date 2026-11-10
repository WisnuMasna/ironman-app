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

export function ZoneChip({
  zone,
  target,
}: {
  zone: string;
  target?: string;
}) {
  const plain = PLAIN[zone] ?? zone;
  const dot =
    zone.startsWith("Z1")
      ? "bg-z1"
      : zone.startsWith("Z2")
        ? "bg-z2"
        : zone.startsWith("Z3")
          ? "bg-z3"
          : zone.startsWith("Z4")
            ? "bg-z4"
            : "bg-z5";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-2 px-2.5 py-1 text-caption font-bold text-muted">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      {zone}
      <span className="font-normal text-faint">· {plain}</span>
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
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-swim-soft px-2.5 py-1 text-caption font-bold text-swim-ink">
      Skill · {checkpoint}
      {rpe !== undefined ? <span className="font-normal">· RPE {rpe}</span> : null}
    </span>
  );
}
