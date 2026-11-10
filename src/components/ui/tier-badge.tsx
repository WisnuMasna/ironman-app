export type TierState = "on-track" | "at-risk" | "off-track" | "needs-data";

export function TierBadge({
  label,
  state,
}: {
  label: string;
  state: TierState;
}) {
  const tone =
    state === "on-track"
      ? "bg-success-soft text-success"
      : state === "at-risk"
        ? "bg-warning-soft text-warning"
        : state === "off-track"
          ? "bg-danger-soft text-danger"
          : "bg-surface-2 text-muted";

  const stateWord =
    state === "on-track"
      ? "on track"
      : state === "at-risk"
        ? "at risk"
        : state === "off-track"
          ? "off track"
          : "needs data";

  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-1 text-caption font-bold ${tone}`}
      aria-label={`${label}, ${stateWord}`}
    >
      {label}
    </span>
  );
}
