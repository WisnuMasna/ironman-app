"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconCalendar,
  IconChart,
  IconFlag,
  IconHome,
  IconSettings,
} from "../icons";

const TABS = [
  { href: "/", label: "Today", icon: IconHome },
  { href: "/week", label: "Plan", icon: IconCalendar },
  { href: "/progress", label: "Progress", icon: IconChart },
  { href: "/race", label: "Races", icon: IconFlag },
  { href: "/profile", label: "Settings", icon: IconSettings },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto grid max-w-[30rem] grid-cols-5 gap-1 px-2 py-2 lg:max-w-[48rem]">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-h-tap flex-col items-center justify-center gap-1 rounded-pill px-1 text-caption font-bold transition-colors duration-[var(--motion-med)] ${
                active
                  ? "bg-primary-soft text-primary"
                  : "text-faint hover:text-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
