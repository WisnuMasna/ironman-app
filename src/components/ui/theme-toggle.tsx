"use client";

import { useSyncExternalStore } from "react";

type ThemePref = "system" | "light" | "dark";

const STORAGE_KEY = "triplan-theme";

function subscribe(onStoreChange: () => void): () => void {
  const onChange = () => onStoreChange();
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readPref(): ThemePref {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "system";
}

function getServerSnapshot(): ThemePref {
  return "system";
}

function applyTheme(pref: ThemePref): void {
  const root = document.documentElement;
  if (pref === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", pref);
  }
  window.localStorage.setItem(STORAGE_KEY, pref);
  window.dispatchEvent(new Event("storage"));
}

export function ThemeToggle() {
  const pref = useSyncExternalStore(subscribe, readPref, getServerSnapshot);

  return (
    <div className="flex rounded-pill bg-surface-2 p-1 text-sm font-bold">
      {(["system", "light", "dark"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => applyTheme(option)}
          className={`min-h-tap flex-1 rounded-pill px-3 capitalize ${
            pref === option ? "bg-surface text-primary shadow-2" : "text-faint"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
