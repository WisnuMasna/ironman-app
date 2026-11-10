import Link from "next/link";

export function EmptyState({
  title,
  body,
  progress,
  href,
  cta,
}: {
  title: string;
  body: string;
  progress?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="rounded-lg bg-surface px-4 py-6 text-center shadow-1">
      <p className="text-h3 font-bold">{title}</p>
      <p className="mt-2 text-sm text-muted">{body}</p>
      {progress ? (
        <p className="mt-2 font-numeric text-caption font-bold text-faint">{progress}</p>
      ) : null}
      {href && cta ? (
        <Link
          href={href}
          className="mt-4 inline-flex min-h-tap items-center justify-center rounded-pill bg-primary-soft px-4 text-sm font-bold text-primary"
        >
          {cta}
        </Link>
      ) : null}
    </div>
  );
}
