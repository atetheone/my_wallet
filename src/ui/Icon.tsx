/** Stroked icon set, ported from the Xaalis design pass. */

export type IconName =
  | "home"
  | "history"
  | "goals"
  | "settings"
  | "plus"
  | "arrow-right"
  | "arrow-left"
  | "check"
  | "chevron-right"
  | "chevron-down"
  | "lock"
  | "fingerprint"
  | "food"
  | "transport"
  | "home2"
  | "health"
  | "leisure"
  | "family"
  | "misc"
  | "wave"
  | "cash"
  | "cloud"
  | "cloud-check"
  | "edit"
  | "trash"
  | "calendar"
  | "sparkle"
  | "shield"
  | "export"
  | "import"
  | "mail"
  | "close"
  | "backspace"
  | "income"
  | "eye";

export function Icon({
  name,
  size = 22,
  stroke = 1.6,
  color = "currentColor",
}: {
  name: IconName;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "home":
      return (
        <svg {...p}>
          <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-9z" />
        </svg>
      );
    case "history":
      return (
        <svg {...p}>
          <path d="M3 12a9 9 0 109-9 9 9 0 00-7.5 4M3 3v5h5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "goals":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.6" fill={color} />
        </svg>
      );
    case "settings":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
        </svg>
      );
    case "plus":
      return (
        <svg {...p}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...p}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg {...p}>
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
      );
    case "check":
      return (
        <svg {...p}>
          <path d="M5 12l5 5 9-11" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...p}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...p}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      );
    case "lock":
      return (
        <svg {...p}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 018 0v3" />
        </svg>
      );
    case "fingerprint":
      return (
        <svg {...p}>
          <path d="M5 12a7 7 0 0114 0v2" />
          <path d="M8.5 12a3.5 3.5 0 017 0v3" />
          <path d="M12 12v5" />
          <path d="M5 16c.5 2 1.5 3.5 3 5" />
          <path d="M19 14c0 3-1 5-2 7" />
        </svg>
      );
    case "food":
      return (
        <svg {...p}>
          <path d="M4 4v6a3 3 0 003 3v7M7 4v5" />
          <path d="M14 4c-1 0-2 2-2 4s1 4 2 4h.5V21h2V4z" />
        </svg>
      );
    case "transport":
      return (
        <svg {...p}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 12h18M7 18v2M17 18v2" />
          <circle cx="8" cy="14" r="0.6" fill={color} />
          <circle cx="16" cy="14" r="0.6" fill={color} />
        </svg>
      );
    case "home2":
      return (
        <svg {...p}>
          <path d="M3 11l9-8 9 8v9a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
          <path d="M9 21v-7h6v7" />
        </svg>
      );
    case "health":
      return (
        <svg {...p}>
          <path d="M20.8 11.5c0 5-8.8 9.5-8.8 9.5s-8.8-4.5-8.8-9.5a5 5 0 018.8-3.3 5 5 0 018.8 3.3z" />
        </svg>
      );
    case "leisure":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
        </svg>
      );
    case "family":
      return (
        <svg {...p}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.2" />
          <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5M14 20c0-2 1.5-3.5 3.5-3.5S21 18 21 20" />
        </svg>
      );
    case "misc":
      return (
        <svg {...p}>
          <circle cx="12" cy="6" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="18" r="1.6" />
        </svg>
      );
    case "wave":
      return (
        <svg {...p}>
          <path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
        </svg>
      );
    case "cash":
      return (
        <svg {...p}>
          <rect x="2.5" y="6" width="19" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M6 9v6M18 9v6" />
        </svg>
      );
    case "cloud":
      return (
        <svg {...p}>
          <path d="M7 18a4 4 0 010-8 5 5 0 019.6-1.4A4 4 0 0117 18z" />
        </svg>
      );
    case "cloud-check":
      return (
        <svg {...p}>
          <path d="M7 18a4 4 0 010-8 5 5 0 019.6-1.4A4 4 0 0117 18z" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      );
    case "edit":
      return (
        <svg {...p}>
          <path d="M16 4l4 4-11 11H5v-4z" />
        </svg>
      );
    case "trash":
      return (
        <svg {...p}>
          <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...p}>
          <rect x="3.5" y="5" width="17" height="15" rx="2" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...p}>
          <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" />
        </svg>
      );
    case "shield":
      return (
        <svg {...p}>
          <path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z" />
        </svg>
      );
    case "export":
      return (
        <svg {...p}>
          <path d="M12 4v12M7 9l5-5 5 5" />
          <path d="M5 20h14" />
        </svg>
      );
    case "import":
      return (
        <svg {...p}>
          <path d="M12 16V4M7 11l5 5 5-5" />
          <path d="M5 20h14" />
        </svg>
      );
    case "mail":
      return (
        <svg {...p}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 7 9-7" />
        </svg>
      );
    case "close":
      return (
        <svg {...p}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "backspace":
      return (
        <svg {...p}>
          <path d="M8 4L2 12l6 8h13a1 1 0 001-1V5a1 1 0 00-1-1z" />
          <path d="M13 9l5 6M18 9l-5 6" />
        </svg>
      );
    case "income":
      return (
        <svg {...p}>
          <path d="M12 19V5M5 12l7-7 7 7" />
          <path d="M5 19h14" />
        </svg>
      );
    case "eye":
      return (
        <svg {...p}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="2.6" fill={color} />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
