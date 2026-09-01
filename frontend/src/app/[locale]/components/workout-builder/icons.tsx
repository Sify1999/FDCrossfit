/// <reference types="react" />

import Image from "next/image";

// ─── Inline SVG icon components ──────────────────────────────────────────
// All use currentColor so they inherit the surrounding text colour.

type IconProps = { className?: string; size?: number };

function IconWrap({ children, className, size = 24 }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#B4E3BD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className ?? ""}>
      {children}
    </svg>
  );
}

/** Dumbbell / barbell — renders the existing SVG file */
export function IconDumbbell(props: IconProps) {
  return (
    <Image
      src="/icons/dumbbell.svg"
      alt="dumbbell"
      width={props.size ?? 24}
      height={props.size ?? 24}
      className={props.className ?? ""}
    />
  );
}

/** Folder — used for templates */
export function IconFolder(props: IconProps) {
  return (
    <IconWrap {...props}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </IconWrap>
  );
}

/** Stopwatch / timer — used for conditioning sections */
export function IconStopwatch(props: IconProps) {
  return (
    <IconWrap {...props}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M10 2h4" />
      <path d="M12 2v2" />
    </IconWrap>
  );
}

/** File / text document — used for free-text sections */
export function IconFileText(props: IconProps) {
  return (
    <IconWrap {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </IconWrap>
  );
}

/** Repeat / sync arrows — used for complex sections */
export function IconRepeat(props: IconProps) {
  return (
    <IconWrap {...props}>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </IconWrap>
  );
}

/** Play / start — for FOR TIME */
export function IconPlay(props: IconProps) {
  return (
    <IconWrap {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </IconWrap>
  );
}

/** Clock — for AMRAP / RFT */
export function IconClock(props: IconProps) {
  return (
    <IconWrap {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </IconWrap>
  );
}

/** Activity / pulse — for EMOM / TABATA */
export function IconActivity(props: IconProps) {
  return (
    <IconWrap {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </IconWrap>
  );
}

/** List / clipboard — for CHIPPER */
export function IconList(props: IconProps) {
  return (
    <IconWrap {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </IconWrap>
  );
}

/** Check / tick — for FOR TIME success */
export function IconCheck(props: IconProps) {
  return (
    <IconWrap {...props}>
      <polyline points="20 6 9 17 4 12" />
    </IconWrap>
  );
}

/** Zap / lightning — for TABATA */
export function IconZap(props: IconProps) {
  return (
    <IconWrap {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </IconWrap>
  );
}

/** Loop / repeat — for RFT */
export function IconLoop(props: IconProps) {
  return (
    <IconWrap {...props}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <polyline points="21 3 21 8 16 8" />
    </IconWrap>
  );
}

/** Trash / delete */
export function IconTrash(props: IconProps) {
  return (
    <IconWrap {...props} size={props.size ?? 16}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </IconWrap>
  );
}

/** Chevron right */
export function IconChevronRight(props: IconProps) {
  return (
    <IconWrap {...props} size={props.size ?? 16}>
      <polyline points="9 18 15 12 9 6" />
    </IconWrap>
  );
}

/** Grip dots (6 dots) — for drag handle */
export function IconGripVertical(props: IconProps) {
  return (
    <svg width={props.size ?? 14} height={props.size ?? 14} viewBox="0 0 24 24" fill="currentColor" className={props.className ?? ""}>
      <circle cx="8" cy="6" r="1.5" />
      <circle cx="16" cy="6" r="1.5" />
      <circle cx="8" cy="12" r="1.5" />
      <circle cx="16" cy="12" r="1.5" />
      <circle cx="8" cy="18" r="1.5" />
      <circle cx="16" cy="18" r="1.5" />
    </svg>
  );
}

/** Arrow up */
export function IconChevronUp(props: IconProps) {
  return (
    <IconWrap {...props} size={props.size ?? 14}>
      <polyline points="18 15 12 9 6 15" />
    </IconWrap>
  );
}

/** Arrow down */
export function IconChevronDown(props: IconProps) {
  return (
    <IconWrap {...props} size={props.size ?? 14}>
      <polyline points="6 9 12 15 18 9" />
    </IconWrap>
  );
}

// ─── Map: icon name → component ─────────────────────────────────────────
// Used by dynamic lookups in template lists, etc.
export const ICON_MAP: Record<string, React.ComponentType<IconProps>> = {
  single: IconDumbbell,
  complex: IconRepeat,
  conditioning: IconStopwatch,
  text: IconFileText,
  template: IconFolder,
};