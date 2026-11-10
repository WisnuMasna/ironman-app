"use client";

import { useState } from "react";
import { findGlossaryTerm, type GlossaryEntry } from "@/content/glossary";

export function TermLink({ term }: { term: string }) {
  const [open, setOpen] = useState(false);
  const entry = findGlossaryTerm(term);

  if (entry === null) {
    return <span>{term}</span>;
  }

  return (
    <>
      <button
        type="button"
        className="font-bold text-primary underline-offset-2 hover:underline"
        onClick={() => setOpen(true)}
      >
        {term}
      </button>
      {open ? (
        <GlossarySheet entry={entry} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function GlossarySheet({
  entry,
  onClose,
}: {
  entry: GlossaryEntry;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-text/40 p-4">
      <div
        role="dialog"
        aria-label={entry.term}
        className="w-full max-w-[30rem] rounded-t-xl bg-surface p-4 shadow-3"
      >
        <p className="text-overline font-bold tracking-[0.08em] text-faint uppercase">
          Glossary
        </p>
        <h2 className="mt-1 text-h2 font-extrabold">{entry.term}</h2>
        <p className="mt-1 text-sm font-bold text-primary">{entry.plain}</p>
        <p className="mt-3 text-sm text-muted">{entry.detail}</p>
        {entry.sourceUrl ? (
          <a
            href={entry.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm font-bold text-primary underline-offset-2 hover:underline"
          >
            Source
          </a>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 flex min-h-tap w-full items-center justify-center rounded-pill bg-primary text-body font-bold text-on-primary"
        >
          Close
        </button>
      </div>
    </div>
  );
}
