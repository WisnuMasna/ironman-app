import Link from "next/link";
import { IconWarning } from "../icons";

export function WarningBanner({
  headline,
  body,
  fixHref,
  fixLabel,
  variant = "warn",
}: {
  headline: string;
  body: string;
  fixHref?: string;
  fixLabel?: string;
  variant?: "info" | "warn" | "danger" | "heat";
}) {
  const tone =
    variant === "danger"
      ? "bg-danger-soft text-danger"
      : variant === "heat"
        ? "bg-heat-soft text-heat"
        : variant === "info"
          ? "bg-info-soft text-info"
          : "bg-warning-soft text-warning";

  return (
    <div
      role="status"
      className={`flex gap-3 rounded-md px-4 py-3 shadow-1 ${tone}`}
    >
      <IconWarning className="mt-0.5 shrink-0" />
      <div className="min-w-0 space-y-1 text-sm">
        <p className="font-bold text-text">{headline}</p>
        <p className="text-muted">{body}</p>
        {fixHref && fixLabel ? (
          <Link href={fixHref} className="font-bold text-primary underline-offset-2 hover:underline">
            {fixLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
