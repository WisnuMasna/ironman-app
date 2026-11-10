"use client";

import { useSyncExternalStore } from "react";
import type { ChecklistItem } from "@/lib/training/checklist";

const STORAGE_KEY = "ironman-race-checklist-done";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function readDone(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object") {
      return parsed as Record<string, boolean>;
    }
  } catch {
    // ignore corrupt storage
  }
  return {};
}

function getServerSnapshot(): Record<string, boolean> {
  return {};
}

export function ChecklistClient({ items }: { items: ChecklistItem[] }) {
  const done = useSyncExternalStore(subscribe, readDone, getServerSnapshot);

  function toggle(id: string): void {
    const next = { ...readDone(), [id]: !done[id] };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("storage"));
  }

  const raceWeek = items.filter((i) => i.kind === "RACE_WEEK");
  const packing = items.filter((i) => i.kind === "PACKING");

  return (
    <div className="space-y-6">
      <ChecklistSection title="Race week" items={raceWeek} done={done} onToggle={toggle} />
      <ChecklistSection title="Packing" items={packing} done={done} onToggle={toggle} />
    </div>
  );
}

function ChecklistSection({
  title,
  items,
  done,
  onToggle,
}: {
  title: string;
  items: ChecklistItem[];
  done: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={Boolean(done[item.id])}
                onChange={() => onToggle(item.id)}
                className="mt-1"
              />
              <span className={done[item.id] ? "text-zinc-400 line-through" : ""}>
                {item.text}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
