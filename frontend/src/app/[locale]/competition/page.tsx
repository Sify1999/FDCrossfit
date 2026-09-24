"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState, useRef, useEffect } from "react";
import Image from "next/image";

/* ─── Icons (inline, currentColor so they inherit) ─────────────────── */
function IconSignIn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}
function IconSchedule() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconScores() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
      <path d="M4 22h16" />
      <path d="M10 22V8h4v14" />
      <path d="M8 22V14H6a2 2 0 0 1 0-4h12a2 2 0 0 1 0 4h-2v8" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconCalendarSmall() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="8 5 19 12 8 19 8 5" />
    </svg>
  );
}
function IconPause() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function IconVolumeOn() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}
function IconVolumeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function ActionButton({
  icon, label, desc, highlight, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  highlight?: boolean;
  onClick: () => void;
}) {
  const base =
    "group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border px-6 py-4 text-start transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4E3BD]/30 sm:w-auto sm:min-w-[210px]";
  const normal =
    "border-gray-200 bg-white text-gray-800 shadow-sm hover:border-[#B4E3BD] hover:shadow-lg hover:shadow-[#B4E3BD]/15 hover:-translate-y-0.5";
  const highlighted =
    "border-transparent bg-[#B4E3BD] text-black shadow-lg shadow-[#B4E3BD]/30 hover:bg-[#a3dcae] hover:shadow-xl hover:shadow-[#B4E3BD]/40 hover:-translate-y-0.5";

  return (
    <button type="button" onClick={onClick} className={`${base} ${highlight ? highlighted : normal}`}>
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
          highlight
            ? "bg-black/10 text-black"
            : "bg-[#B4E3BD]/10 text-[#7fb98a] group-hover:bg-[#B4E3BD]/20 group-hover:text-[#5fa06d]"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className={`text-xs ${highlight ? "text-black/60" : "text-gray-400"}`}>{desc}</p>
      </div>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={`shrink-0 rtl:-scale-x-100 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 ${
          highlight ? "text-black/50" : "text-gray-300 group-hover:text-[#B4E3BD]"
        }`}
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}

/* ─── Custom SVG icons for difficulty levels (replace emoji) ──────── */
function IconSprout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5FA06D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#B4E3BD]">
      <path d="M12 22v-8" />
      <path d="M12 14c-2.5 0-5-1.5-5-5 0-3 2.5-6 5-6s5 3 5 6c0 3.5-2.5 5-5 5z" />
      <path d="M10 12c1.5-1 3-2.5 3-5" />
    </svg>
  );
}
function IconFlame() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5FA06D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff8c42]">
      <path d="M12 2c-3 4-5 7-5 10a5 5 0 0 0 10 0c0-3-2-6-5-10z" />
      <path d="M12 22c-2 0-3-1-3-2s1-2 3-2 3 1 3 2-1 2-3 2z" />
      <path d="M8 12c1-1 2-2 4-2" />
    </svg>
  );
}
function IconDiamond() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5FA06D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8ab4f8]">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 7v10l10 5V12" />
      <path d="M22 7v10l-10 5V12" />
    </svg>
  );
}

const LEVEL_ICONS: Record<string, React.ReactNode> = {
  beginner: <IconSprout />,
  intermediate: <IconFlame />,
  advanced: <IconDiamond />,
};

/* ─── Difficulty levels — single source of truth ───────────────── */
const LEVELS = [
  { key: "beginner" as const },
  { key: "intermediate" as const },
  { key: "advanced" as const },
] as const;

type LevelKey = (typeof LEVELS)[number]["key"];

/* ─── Difficulty picker popover ─────────────────────────────────────
   Purely presentational — open/close and outside-click handling live in
   the parent, wrapping both the trigger button and this popover in one
   boundary, so there is exactly one thing deciding open vs. closed. */
function DifficultyPicker({
  t, open, onSelect,
}: {
  t: (key: string) => string;
  open: boolean;
  onSelect: (level: LevelKey) => void;
}) {
  if (!open) return null;

  return (
    <div className="absolute start-0 top-full z-50 mt-2 w-full min-w-[260px] overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl shadow-black/10">
      <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-[#91C78C]">
        {t("difficulty.label")}
      </p>
      {LEVELS.map((lvl) => (
        <button
          key={lvl.key}
          type="button"
          onClick={() => onSelect(lvl.key)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start text-sm text-gray-600 transition hover:bg-[#B4E3BD]/10"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B4E3BD]/10">{LEVEL_ICONS[lvl.key]}</span>
          <div>
            <p className="font-medium text-gray-900">{t(`difficulty.${lvl.key}`)}</p>
            <p className="text-xs text-gray-400">{t(`difficulty.${lvl.key}Desc`)}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ─── Level tabs — segmented control for the schedule section.
   Plain active/inactive state, direction-safe. On phones the three
   tabs share the full width equally so they never wrap. ─────────── */
function LevelTabs({
  t, active, onChange,
}: {
  t: (key: string) => string;
  active: LevelKey;
  onChange: (level: LevelKey) => void;
}) {
  return (
    <div className="mx-auto mb-8 grid w-full max-w-md grid-cols-3 gap-1 rounded-full border border-white/10 bg-[#141414] p-1 sm:mb-12 sm:gap-1.5 sm:p-1.5">
      {LEVELS.map((lvl) => {
        const isActive = active === lvl.key;
        return (
          <button
            key={lvl.key}
            type="button"
            onClick={() => onChange(lvl.key)}
            className={`flex items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-xs font-semibold transition-colors duration-300 sm:px-4 sm:text-sm ${
              isActive ? "bg-[#B4E3BD] text-black" : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {t(`difficulty.${lvl.key}`)}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Schedule data — 4 events per level with richer fields ──────── */
type CompetitionEvent = {
  id: string;
  date: string;
  time: string;
};

const SCHEDULE: Record<LevelKey, CompetitionEvent[]> = {
  beginner: [
    { id: "b1", date: "Sat, Jun 14", time: "9:00 AM" },
    { id: "b2", date: "Sat, Jun 14", time: "10:15 AM" },
    { id: "b3", date: "Sat, Jun 14", time: "11:30 AM" },
    { id: "b4", date: "Sat, Jun 14", time: "1:00 PM" },
  ],
  intermediate: [
    { id: "i1", date: "Sat, Jun 14", time: "9:00 AM" },
    { id: "i2", date: "Sat, Jun 14", time: "10:15 AM" },
    { id: "i3", date: "Sat, Jun 14", time: "11:30 AM" },
    { id: "i4", date: "Sat, Jun 14", time: "1:00 PM" },
  ],
  advanced: [
    { id: "a1", date: "Sat, Jun 14", time: "9:00 AM" },
    { id: "a2", date: "Sat, Jun 14", time: "10:15 AM" },
    { id: "a3", date: "Sat, Jun 14", time: "11:30 AM" },
    { id: "a4", date: "Sat, Jun 14", time: "1:00 PM" },
    ],
};
/* ─── Leaderboard test data with event (1-4) per athlete ──────────── */
type LeaderboardEntry = {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  event: 1 | 2 | 3 | 4;
  score: number;
};

const LEADERBOARD_DATA: LeaderboardEntry[] = [
  // Event 1
  { name: "Parsa A.",   level: "Advanced",      event: 1, score: 1245 },
  { name: "Sara M.",    level: "Intermediate",   event: 1, score: 1180 },
  { name: "Kim L.",     level: "Beginner",       event: 1, score: 1090 },
  { name: "Mike T.",    level: "Intermediate",   event: 1, score: 964  },
  // Event 2
  { name: "John D.",    level: "Advanced",      event: 2, score: 1132 },
  { name: "Amir H.",    level: "Intermediate",   event: 2, score: 1045 },
  { name: "Elena R.",   level: "Beginner",       event: 2, score: 998  },
  { name: "Chris B.",   level: "Beginner",       event: 2, score: 887  },
  // Event 3
  { name: "Fatemeh K.", level: "Advanced",      event: 3, score: 912  },
  { name: "Omid J.",    level: "Intermediate",   event: 3, score: 843  },
  { name: "Ali R.",     level: "Intermediate",   event: 3, score: 790  },
  { name: "Nina W.",    level: "Beginner",       event: 3, score: 755  },
  // Event 4
  { name: "Tom S.",     level: "Advanced",      event: 4, score: 820  },
  { name: "Laleh M.",   level: "Intermediate",   event: 4, score: 765  },
  { name: "Jack P.",    level: "Beginner",       event: 4, score: 710  },
  { name: "Reza K.",    level: "Beginner",       event: 4, score: 690  },
];

const LEVEL_BADGE_STYLES: Record<string, string> = {
  Beginner: "bg-[#B4E3BD]/10 text-[#B4E3BD] border-[#B4E3BD]/20",
  Intermediate: "bg-amber-50 text-amber-600 border-amber-200/60",
  Advanced: "bg-sky-50 text-sky-600 border-sky-200/60",
};

function LevelBadge({ level }: { level: string }) {
  return (
    <span className={`inline-block rounded-full border px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${LEVEL_BADGE_STYLES[level] || ""}`}>
      {level}
    </span>
  );
}

/* ─── Event card ─────────────────────────────────────────────────────
   One horizontal row, three equal columns (event · time · date), so the
   content is centered perfectly at every width. dir="ltr" keeps the
   column order and the dividers identical in Farsi and English — the
   content is just numbers and short English strings, so nothing reads
   wrong. On phones the sizes shrink but it stays on ONE line. ──────── */
function EventCard({ index, event }: { index: number; event: CompetitionEvent }) {
  const [timeValue, meridiem] = event.time.split(" ");

  return (
    <div
      dir="ltr"
      style={{ animationDelay: `${index * 90}ms` }}
      className="
        group relative overflow-hidden rounded-2xl border border-white/10
        bg-gradient-to-br from-[#1a1a1a] to-[#121212]
        shadow-lg shadow-black/40
        opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]
        transition-all duration-500
        hover:-translate-y-1 hover:border-[#B4E3BD]/60
        hover:shadow-2xl hover:shadow-[#B4E3BD]/20
      "
    >
      {/* Top mint hairline — same motif as the section dividers */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B4E3BD]/40 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-100"
      />
      {/* Soft hover glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B4E3BD]/0 blur-3xl transition-colors duration-500 group-hover:bg-[#B4E3BD]/10"
      />

      <div className="relative grid grid-cols-3 items-center divide-x divide-white/10 py-4 text-center sm:py-6">
        {/* Event number */}
        <div className="flex flex-col items-center justify-center gap-1.5 px-2">
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-500 sm:text-[11px]">
            Event
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#B4E3BD]/40 bg-[#B4E3BD]/10 text-sm font-black text-[#B4E3BD] transition-all duration-300 group-hover:border-[#B4E3BD] group-hover:bg-[#B4E3BD] group-hover:text-black sm:h-10 sm:w-10 sm:text-lg">
            {index + 1}
          </span>
        </div>

        {/* Time */}
        <div className="flex flex-col items-center justify-center gap-0.5 px-2">
          <span className="flex items-baseline justify-center gap-1">
            <span className="text-xl font-black leading-none tracking-tight text-white sm:text-4xl">
              {timeValue}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#B4E3BD] sm:text-xs">
              {meridiem}
            </span>
          </span>
          <span className="mt-1 hidden items-center gap-1 text-[10px] uppercase tracking-widest text-gray-600 sm:flex">
            <IconClock />
            Start
          </span>
        </div>

        {/* Date */}
        <div className="flex flex-col items-center justify-center gap-1.5 px-2">
          <span className="text-[#B4E3BD]/70 transition-colors duration-300 group-hover:text-[#B4E3BD]">
            <IconCalendarSmall />
          </span>
          <span className="text-xs font-semibold leading-tight text-gray-300 sm:text-base">
            {event.date}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared section header with enhanced styling ───────────────── */
function SectionHeader({
  icon, eyebrow, title, description,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#B4E3BD]/20 bg-gradient-to-br from-[#1c1c1c] to-[#141414] text-[#B4E3BD] shadow-lg shadow-[#B4E3BD]/10 ring-1 ring-[#B4E3BD]/10">
        <div className="flex h-10 w-10 items-center justify-center text-[#B4E3BD] [&_svg]:h-full [&_svg]:w-full">{icon}</div>
      </div>
      <span className="mb-4 block text-sm font-bold uppercase tracking-[0.2em] text-[#B4E3BD]">
        {eyebrow}
      </span>
      <h2 className="mb-6 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
        {title}
      </h2>
      <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-gray-400 sm:mb-12 sm:text-lg">
        {description}
      </p>
    </div>
  );
}

function BackToTop({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border-2 border-[#B4E3BD] px-6 py-2.5 text-sm font-semibold text-[#B4E3BD] transition-all duration-300 hover:bg-[#B4E3BD] hover:text-black"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 15l-6-6-6 6" />
      </svg>
      Back to top
    </button>
  );
}

/* ─── Filter dropdown for the scores table headers ────────────────── */
function FilterDropdown({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { value: string | number | null; label: string }[];
  selected: string | number | null;
  onSelect: (val: string | number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const currentLabel =
    selected === null ? label : options.find((o) => o.value === selected)?.label ?? label;

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-[0.15em] transition-all duration-200 ${
          selected !== null
            ? "bg-[#B4E3BD]/10 text-[#B4E3BD]"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        }`}
      >
        {currentLabel}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[160px] rounded-xl border border-gray-200 bg-white py-1 shadow-xl shadow-black/5">
          {options.map((opt) => {
            const isActive = selected === opt.value;
            return (
              <button
                key={String(opt.value)}
                onClick={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
                  isActive ? "bg-[#B4E3BD]/10 font-semibold text-[#B4E3BD]" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="shrink-0 text-[#B4E3BD]">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                <span className={isActive ? "" : "ml-6"}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
/* ─── Page component ────────────────────────────────────────────── */
export default function CompetitionPage() {
  const t = useTranslations("competition");
  const locale = useLocale();
  const isRTL = locale === "fa";

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Sync the play state with the actual video element after hydration,
  // in case the browser auto-played it despite preload="none".
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setIsPlaying(!video.paused);
    setIsMuted(video.muted);
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      toggleMute();
    } else {
      video.pause();
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ── Leaderboard filters ──────────────────────────────────────────
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<number | null>(null);

  const filtered = LEADERBOARD_DATA
    .filter((r) => !levelFilter || r.level === levelFilter)
    .filter((r) => !eventFilter || r.event === eventFilter)
    .sort((a, b) => b.score - a.score)
    .map((row, i) => ({ ...row, place: i + 1 }));

  // ── Schedule difficulty picker ─────────────────────────────────────
  // One ref wraps BOTH the trigger button and the popover, so a click on
  // the trigger is always "inside" — the outside-click handler below can
  // never treat it as an outside click and race with the toggle. That
  // race (close-via-outside-click, then immediately reopen-via-toggle)
  // was the cause of the open→close→reopen flicker.
  const [diffOpen, setDiffOpen] = useState(false);
  const [activeLevel, setActiveLevel] = useState<LevelKey>("beginner");
  const scheduleTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!diffOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (scheduleTriggerRef.current && !scheduleTriggerRef.current.contains(e.target as Node)) {
        setDiffOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [diffOpen]);

  const handleDifficultySelect = useCallback((level: LevelKey) => {
    setDiffOpen(false);
    setActiveLevel(level);
    sessionStorage.setItem("competition_level", level);
    scrollTo("section-schedule");
  }, [scrollTo]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
      {/* ════════════════════════════════════════════════════════════════
          HERO — Video always left / Text + Buttons right
      ════════════════════════════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative flex min-h-screen w-full items-center overflow-hidden bg-gradient-to-b from-[#FAF9F5] to-[#F1EEE4] px-6 py-24 text-gray-900 sm:px-12 lg:py-0"
      >
        {/*
          The video must always sit on the physical left, in both fa and en.
          Forcing dir="ltr" on this block would also flatten the Farsi text
          to left-aligned, which is wrong — so instead we only flip the flex
          direction based on locale, and let every text node keep following
          the page's real reading direction.
        */}
        <div
          className={`relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-12 md:gap-20 ${
            isRTL ? "md:flex-row-reverse" : "md:flex-row"
          }`}
        >
          {/* ─── Video (always physically left) ────────────────────── */}
          <div className="group relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl shadow-xl shadow-black/10 transition-shadow duration-500 hover:shadow-2xl hover:shadow-[#B4E3BD]/25 md:w-1/2">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              src="/videos/competition.mp4"
              poster="/images/competition.png"
              muted
              loop
              preload="none"
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Click target + state overlay. While playing it's invisible
                until hovered (a quiet hint that it's clickable); while
                paused it's always shown, with a glowing mint-ringed play
                button so it reads unmistakably as "tap to resume". */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause video" : "Play video"}
              suppressHydrationWarning
              className={`absolute inset-0 flex items-center justify-center transition-colors duration-300 ${
                isPlaying
                  ? "bg-transparent group-hover:bg-gradient-to-t group-hover:from-black/50 group-hover:via-black/5 group-hover:to-black/10"
                  : "bg-gradient-to-t from-black/65 via-black/15 to-black/35"
              }`}
            >
              <span
                suppressHydrationWarning
                className={`flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#B4E3BD] bg-black/50 text-[#B4E3BD] shadow-[0_0_50px_-10px_#B4E3BD] backdrop-blur-sm transition-all duration-300 ${
                  isPlaying
                    ? "scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                    : "scale-100 opacity-100 hover:scale-110"
                }`}
              >
                {isPlaying ? <IconPause /> : <IconPlay />}
              </span>
            </button>

            {/* Mute toggle — sits above the overlay, always reachable */}
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute video" : "Mute video"}
              className="absolute bottom-3 end-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
            >
              {isMuted ? <IconVolumeOff /> : <IconVolumeOn />}
            </button>
          </div>

          {/* ─── Text + Buttons — reads in the locale's natural direction ── */}
          <div className="flex w-full flex-col items-start gap-8 md:w-1/2">
            <h1 className="text-4xl font-black uppercase leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-gray-500 sm:text-xl">
              {t("hero.subtitle")}
            </p>

            {/* ─── 3 Action Buttons ────────────────────────────────── */}
            <div className="relative flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div ref={scheduleTriggerRef} className="relative">
                <ActionButton
                  icon={<IconSchedule />}
                  label={t("hero.btnSchedule")}
                  desc="Choose your level"
                  onClick={() => setDiffOpen((p) => !p)}
                />
                <DifficultyPicker t={t} open={diffOpen} onSelect={handleDifficultySelect} />
              </div>
              <ActionButton
                icon={<IconScores />}
                label={t("hero.btnScores")}
                desc="Live rankings"
                onClick={() => scrollTo("section-scores")}
              />
              <ActionButton
                icon={<IconSignIn />}
                label={t("hero.btnSignIn")}
                desc="Register to compete"
                highlight
                onClick={() => scrollTo("section-signIn")}
              />
            </div>

            {/* Scroll hint */}
            <p className="flex items-center gap-2 pt-2 text-sm text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-bounce text-[#5fa06d]">
                <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
              </svg>
              Scroll to explore
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SIGN IN SECTION (ثبت نام)
      ════════════════════════════════════════════════════════════════ */}
      <section id="section-signIn" className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black px-6 py-24 sm:px-12">
        <div aria-hidden className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#B4E3BD]/50 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-24 -z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[#B4E3BD]/10 blur-3xl" />
        <div className="relative z-10">
          <SectionHeader
            icon={<IconSignIn />}
            eyebrow={t("hero.btnSignIn")}
            title={t("signIn.title")}
            description={t("signIn.description")}
          />
          <div className="flex justify-center">
            <BackToTop onClick={() => scrollTo("hero")} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SCHEDULE SECTION (زمان بندی)
      ════════════════════════════════════════════════════════════════ */}
      <section id="section-schedule" className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#111111] px-4 py-20 sm:px-12 sm:py-24">
        <div aria-hidden className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#B4E3BD]/30 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute -right-32 top-1/3 h-72 w-72 rounded-full bg-[#B4E3BD]/5 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-32 bottom-1/4 h-72 w-72 rounded-full bg-[#B4E3BD]/5 blur-3xl" />
        <div className="relative z-10 w-full">
          <SectionHeader
            icon={<IconSchedule />}
            eyebrow={t("hero.btnSchedule")}
            title={t("schedule.title")}
            description={t("schedule.description")}
          />

          <LevelTabs t={t} active={activeLevel} onChange={setActiveLevel} />

          {/* Single centered column of one-line cards. `key` remounts the
              list on level change so the staggered fade-in replays. */}
          <div
            key={activeLevel}
            className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:gap-4"
          >
            {SCHEDULE[activeLevel].map((event, i) => (
              <EventCard key={event.id} index={i} event={event} />
            ))}
          </div>

          <div className="mt-10 flex justify-center sm:mt-12">
            <BackToTop onClick={() => scrollTo("hero")} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SCORES SECTION (جدول امتیازات)
      ════════════════════════════════════════════════════════════════ */}
      <section id="section-scores" className="relative min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 px-6 py-24 sm:px-12">
        {/* Decorative blur blobs */}
        <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#B4E3BD]/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#B4E3BD]/5 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-14 text-center">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#B4E3BD]/30 bg-white text-[#B4E3BD] shadow-lg shadow-[#B4E3BD]/10 ring-1 ring-[#B4E3BD]/10">
              <div className="flex h-10 w-10 items-center justify-center text-[#B4E3BD] [&_svg]:h-full [&_svg]:w-full">
                <IconScores />
              </div>
            </div>
            <span className="mb-4 block text-sm font-bold uppercase tracking-[0.2em] text-[#B4E3BD]">
              {t("hero.btnScores")}
            </span>
            <h2 className="mb-6 text-3xl font-black uppercase tracking-tight text-gray-900 sm:text-5xl">
              {t("scores.title")}
            </h2>
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-gray-500">
              {t("scores.description")}
            </p>
          </div>

          {/* Leaderboard Table */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/80">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.15em] text-gray-500 first:pl-6">Place</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.15em] text-gray-500">Name</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
                    <FilterDropdown
                      label="Level"
                      options={[
                        { value: null, label: "All Levels" },
                        { value: "Beginner", label: "Beginner" },
                        { value: "Intermediate", label: "Intermediate" },
                        { value: "Advanced", label: "Advanced" },
                      ]}
                      selected={levelFilter}
                      onSelect={(v) => setLevelFilter(v as string | null)}
                    />
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
                    <FilterDropdown
                      label="Event"
                      options={[
                        { value: null, label: "All Events" },
                        { value: 1, label: "Event 1" },
                        { value: 2, label: "Event 2" },
                        { value: 3, label: "Event 3" },
                        { value: 4, label: "Event 4" },
                      ]}
                      selected={eventFilter}
                      onSelect={(v) => setEventFilter(v as number | null)}
                    />
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.15em] text-gray-500 last:pr-6">Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                      No results match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => {
                    const badge =
                      row.place === 1
                        ? "bg-yellow-100 text-yellow-700 shadow-sm shadow-yellow-200/50"
                        : row.place === 2
                          ? "bg-gray-200 text-gray-500 shadow-sm shadow-gray-300/50"
                          : row.place === 3
                            ? "bg-amber-100 text-amber-700 shadow-sm shadow-amber-200/50"
                            : "text-gray-500";

                    const rowBg =
                      row.place === 1
                        ? "bg-yellow-50 hover:bg-yellow-100"
                        : row.place === 2
                          ? "bg-gray-100 hover:bg-gray-200"
                          : row.place === 3
                            ? "bg-amber-50 hover:bg-amber-100"
                            : "hover:bg-[#B4E3BD]/5";

                    return (
                      <tr key={`${row.name}-${row.event}`} className={`border-b border-gray-100 transition-colors duration-200 last:border-0 ${rowBg}`}>
                        <td className="px-5 py-4 first:pl-6">
                          <span className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-sm font-black tabular-nums ${badge}`}>
                            {row.place}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">{row.name}</td>
                        <td className="px-5 py-4"><LevelBadge level={row.level} /></td>
                        <td className="px-5 py-4 text-sm text-gray-600">Event {row.event}</td>
                        <td className="px-5 py-4 text-right text-sm font-bold tabular-nums text-gray-900 last:pr-6">
                          {row.score.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Back to top */}
          <div className="mt-12 flex justify-center">
            <BackToTop onClick={() => scrollTo("hero")} />
          </div>
        </div>
      </section>
    </main>
  );
}