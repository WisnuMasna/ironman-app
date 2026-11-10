import type { ReactNode } from "react";

type IconProps = { className?: string; title?: string };

function Svg({
  className,
  title,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconSwim(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M10 10c1.5 1 3 2.5 3 4.5" />
    </Svg>
  );
}

export function IconBike(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6.5" cy="16.5" r="3" />
      <circle cx="17.5" cy="16.5" r="3" />
      <path d="M6.5 16.5 10 9h4l3.5 7.5M10 9l2 4h4" />
    </Svg>
  );
}

export function IconRun(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="14" cy="5" r="2" />
      <path d="M8 21l3-6 3 2 3-5M11 15l-2-3 4-3 2 2" />
    </Svg>
  );
}

export function IconStrength(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 9v6M18 9v6M8 8v8M16 8v8M8 12h8M4 10v4M20 10v4" />
    </Svg>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 14.5A7.5 7.5 0 0 1 9.5 4 7.5 7.5 0 1 0 20 14.5Z" />
    </Svg>
  );
}

export function IconHome(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </Svg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </Svg>
  );
}

export function IconChart(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" />
    </Svg>
  );
}

export function IconFlag(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 21V4M5 4h10l-2 4 2 4H5" />
    </Svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M4.9 6.5l1.4 1.4M17.7 16.1l1.4 1.4M3 12h2M19 12h2M4.9 17.5l1.4-1.4M17.7 7.9l1.4-1.4" />
    </Svg>
  );
}

export function IconChevron(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

export function IconWarning(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 3 20h18L12 3Z" />
      <path d="M12 10v4M12 17h.01" />
    </Svg>
  );
}
