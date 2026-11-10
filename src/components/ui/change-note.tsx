export function ChangeNote({ note }: { note: string }) {
  return (
    <p className="rounded-md bg-info-soft px-3 py-2 text-sm text-info" role="status">
      <span className="font-bold text-text">Why this changed · </span>
      {note}
    </p>
  );
}

export function ChangeNoteList({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null;
  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <ChangeNote key={note} note={note} />
      ))}
    </div>
  );
}
