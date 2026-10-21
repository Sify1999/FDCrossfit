"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState, useRef, useEffect } from "react";
import Image from "next/image";
import { api } from "@/lib/api-client";
import AddAthleteModal from "../components/AddAthleteModal";
import ShowAthletesModal from "../components/ShowAthletesModal";

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

/* ─── Schedule data — 4 days per level. Each day holds a list of
   events, and every event holds the heats that run throughout the
   day (heat number + start time). ───────────────────────────────── */
type Heat = {
  heat: number;
  time: string;
  /** End time — the heat renders as a compact range, e.g. "8:00-8:12" */
  end: string;
};

type CompetitionEvent = {
  name: string;
  heats: Heat[];
};

type CompetitionDay = {
  id: string;
  day: number;
  date: string;
  events: CompetitionEvent[];
};

const SCHEDULE: Record<LevelKey, CompetitionDay[]> = {
  beginner: [
    {
      id: "b-day1",
      day: 1,
      date: "Sat, Jun 14",
      events: [
        {
          name: "Fundamentals WOD",
          heats: [
            { heat: 1, time: "8:00 AM", end: "8:12 AM" },
            { heat: 2, time: "8:25 AM", end: "8:38 AM" },
            { heat: 3, time: "8:50 AM", end: "9:03 AM" },
          ],
        },
        {
          name: "Max Back Squat",
          heats: [
            { heat: 1, time: "10:15 AM", end: "10:28 AM" },
            { heat: 2, time: "10:40 AM", end: "10:53 AM" },
          ],
        },
        {
          name: "AMRAP 10",
          heats: [
            { heat: 1, time: "1:00 PM", end: "1:12 PM" },
            { heat: 2, time: "1:25 PM", end: "1:37 PM" },
            { heat: 3, time: "1:50 PM", end: "2:02 PM" },
          ],
        },
      ],
    },
    {
      id: "b-day2",
      day: 2,
      date: "Sun, Jun 15",
      events: [
        {
          name: "Partner Relay",
          heats: [
            { heat: 1, time: "9:00 AM", end: "9:14 AM" },
            { heat: 2, time: "9:25 AM", end: "9:39 AM" },
          ],
        },
        {
          name: "Deadlift Ladder",
          heats: [
            { heat: 1, time: "11:15 AM", end: "11:30 AM" },
            { heat: 2, time: "11:40 AM", end: "11:55 AM" },
            { heat: 3, time: "12:05 PM", end: "12:20 PM" },
          ],
        },
        {
          name: "Row Sprint",
          heats: [
            { heat: 1, time: "2:00 PM", end: "2:14 PM" },
            { heat: 2, time: "2:25 PM", end: "2:39 PM" },
          ],
        },
      ],
    },
    {
      id: "b-day3",
      day: 3,
      date: "Mon, Jun 16",
      events: [
        {
          name: "Strength Circuit",
          heats: [
            { heat: 1, time: "8:30 AM", end: "8:44 AM" },
            { heat: 2, time: "8:55 AM", end: "9:09 AM" },
            { heat: 3, time: "9:20 AM", end: "9:34 AM" },
          ],
        },
        {
          name: "Burpee Mile",
          heats: [
            { heat: 1, time: "11:00 AM", end: "11:14 AM" },
            { heat: 2, time: "11:25 AM", end: "11:39 AM" },
          ],
        },
        {
          name: "Team Throwdown",
          heats: [
            { heat: 1, time: "1:30 PM", end: "1:42 PM" },
            { heat: 2, time: "1:55 PM", end: "2:07 PM" },
            { heat: 3, time: "2:20 PM", end: "2:32 PM" },
          ],
        },
      ],
    },
    {
      id: "b-day4",
      day: 4,
      date: "Tue, Jun 17",
      events: [
        {
          name: "Clean & Jerk Test",
          heats: [
            { heat: 1, time: "9:15 AM", end: "9:30 AM" },
            { heat: 2, time: "9:40 AM", end: "9:55 AM" },
          ],
        },
        {
          name: "Final Showdown",
          heats: [
            { heat: 1, time: "12:00 PM", end: "12:14 PM" },
            { heat: 2, time: "12:25 PM", end: "12:39 PM" },
            { heat: 3, time: "12:50 PM", end: "1:04 PM" },
          ],
        },
        {
          name: "Awards Ceremony",
          heats: [{ heat: 1, time: "4:00 PM", end: "4:45 PM" }],
        },
      ],
    },
  ],
  intermediate: [
    {
      id: "i-day1",
      day: 1,
      date: "Sat, Jun 14",
      events: [
        {
          name: "Opening AMRAP",
          heats: [
            { heat: 1, time: "8:30 AM", end: "8:45 AM" },
            { heat: 2, time: "8:55 AM", end: "9:10 AM" },
            { heat: 3, time: "9:20 AM", end: "9:35 AM" },
          ],
        },
        {
          name: "Max Clean & Jerk",
          heats: [
            { heat: 1, time: "10:45 AM", end: "10:58 AM" },
            { heat: 2, time: "11:10 AM", end: "11:23 AM" },
            { heat: 3, time: "11:35 AM", end: "11:48 AM" },
          ],
        },
        {
          name: "Chipper 15",
          heats: [
            { heat: 1, time: "1:30 PM", end: "1:45 PM" },
            { heat: 2, time: "1:55 PM", end: "2:10 PM" },
          ],
        },
      ],
    },
    {
      id: "i-day2",
      day: 2,
      date: "Sun, Jun 15",
      events: [
        {
          name: "Hero WOD",
          heats: [
            { heat: 1, time: "9:30 AM", end: "9:45 AM" },
            { heat: 2, time: "9:55 AM", end: "10:10 AM" },
          ],
        },
        {
          name: "Thruster Ladder",
          heats: [
            { heat: 1, time: "11:45 AM", end: "12:00 PM" },
            { heat: 2, time: "12:10 PM", end: "12:25 PM" },
            { heat: 3, time: "12:35 PM", end: "12:50 PM" },
          ],
        },
        {
          name: "Sprint Rounds",
          heats: [
            { heat: 1, time: "2:30 PM", end: "2:44 PM" },
            { heat: 2, time: "2:55 PM", end: "3:09 PM" },
          ],
        },
      ],
    },
    {
      id: "i-day3",
      day: 3,
      date: "Mon, Jun 16",
      events: [
        {
          name: "Deadlift Superset",
          heats: [
            { heat: 1, time: "8:45 AM", end: "9:00 AM" },
            { heat: 2, time: "9:10 AM", end: "9:25 AM" },
            { heat: 3, time: "9:35 AM", end: "9:50 AM" },
          ],
        },
        {
          name: "Double-Under Derby",
          heats: [
            { heat: 1, time: "11:15 AM", end: "11:30 AM" },
            { heat: 2, time: "11:40 AM", end: "11:55 AM" },
          ],
        },
        {
          name: "Trio Tag-Team",
          heats: [
            { heat: 1, time: "1:45 PM", end: "2:00 PM" },
            { heat: 2, time: "2:10 PM", end: "2:25 PM" },
            { heat: 3, time: "2:35 PM", end: "2:50 PM" },
          ],
        },
      ],
    },
    {
      id: "i-day4",
      day: 4,
      date: "Tue, Jun 17",
      events: [
        {
          name: "Snatch Complex",
          heats: [
            { heat: 1, time: "9:30 AM", end: "9:47 AM" },
            { heat: 2, time: "9:55 AM", end: "10:12 AM" },
          ],
        },
        {
          name: "Finisher",
          heats: [
            { heat: 1, time: "12:15 PM", end: "12:27 PM" },
            { heat: 2, time: "12:40 PM", end: "12:52 PM" },
          ],
        },
        {
          name: "Podium & Awards",
          heats: [{ heat: 1, time: "4:30 PM", end: "5:15 PM" }],
        },
      ],
    },
  ],
  advanced: [
    {
      id: "a-day1",
      day: 1,
      date: "Sat, Jun 14",
      events: [
        {
          name: "Qualifier AMRAP",
          heats: [
            { heat: 1, time: "8:15 AM", end: "8:30 AM" },
            { heat: 2, time: "8:40 AM", end: "8:55 AM" },
            { heat: 3, time: "9:05 AM", end: "9:20 AM" },
          ],
        },
        {
          name: "Max Snatch",
          heats: [
            { heat: 1, time: "10:30 AM", end: "10:42 AM" },
            { heat: 2, time: "10:55 AM", end: "11:07 AM" },
            { heat: 3, time: "11:20 AM", end: "11:32 AM" },
          ],
        },
        {
          name: "Couplet 20",
          heats: [
            { heat: 1, time: "1:15 PM", end: "1:30 PM" },
            { heat: 2, time: "1:40 PM", end: "1:55 PM" },
          ],
        },
      ],
    },
    {
      id: "a-day2",
      day: 2,
      date: "Sun, Jun 15",
      events: [
        {
          name: "International WOD",
          heats: [
            { heat: 1, time: "9:15 AM", end: "9:32 AM" },
            { heat: 2, time: "9:40 AM", end: "9:57 AM" },
          ],
        },
        {
          name: "Clean Ladder",
          heats: [
            { heat: 1, time: "11:30 AM", end: "11:45 AM" },
            { heat: 2, time: "11:55 AM", end: "12:10 PM" },
            { heat: 3, time: "12:20 PM", end: "12:35 PM" },
          ],
        },
        {
          name: "Sprint Finals",
          heats: [
            { heat: 1, time: "2:15 PM", end: "2:28 PM" },
            { heat: 2, time: "2:40 PM", end: "2:53 PM" },
          ],
        },
      ],
    },
    {
      id: "a-day3",
      day: 3,
      date: "Mon, Jun 16",
      events: [
        {
          name: "Strength Trial",
          heats: [
            { heat: 1, time: "8:20 AM", end: "8:36 AM" },
            { heat: 2, time: "8:45 AM", end: "9:01 AM" },
          ],
        },
        {
          name: "Rope & Row",
          heats: [
            { heat: 1, time: "10:45 AM", end: "10:58 AM" },
            { heat: 2, time: "11:10 AM", end: "11:23 AM" },
            { heat: 3, time: "11:35 AM", end: "11:48 AM" },
          ],
        },
        {
          name: "Championship Relay",
          heats: [
            { heat: 1, time: "1:30 PM", end: "1:44 PM" },
            { heat: 2, time: "1:55 PM", end: "2:09 PM" },
            { heat: 3, time: "2:20 PM", end: "2:34 PM" },
          ],
        },
      ],
    },
    {
      id: "a-day4",
      day: 4,
      date: "Tue, Jun 17",
      events: [
        {
          name: "Final Event",
          heats: [
            { heat: 1, time: "9:45 AM", end: "10:00 AM" },
            { heat: 2, time: "10:10 AM", end: "10:25 AM" },
          ],
        },
        {
          name: "Showdown",
          heats: [
            { heat: 1, time: "12:30 PM", end: "12:44 PM" },
            { heat: 2, time: "12:55 PM", end: "1:09 PM" },
          ],
        },
        {
          name: "Champion Ceremony",
          heats: [{ heat: 1, time: "5:00 PM", end: "5:45 PM" }],
        },
      ],
    },
  ],
};
/* ─── Leaderboard types ──────────────────────────── */
type LeaderboardEntry = {
  id: number;
  name: string;
  level: string;
  event: number;
  score: number | null;
  tiebreaker_type: string | null;
  tiebreaker_value: number | null;
};

type AthleteFromApi = {
  id: number;
  name: string;
  level: string;
  event: number;
  score: number | null;
  tiebreaker_type: string | null;
  tiebreaker_value: number | null;
  created_at: string;
  updated_at: string;
};

const LEVEL_BADGE_STYLES: Record<string, string> = {
  Beginner: "bg-[#B4E3BD]/35 text-[#1a6b3d] border-[#B4E3BD]/50 shadow-sm shadow-[#B4E3BD]/20",
  Intermediate: "bg-[#f97316]/35 text-[#7c1d00] border-[#f97316]/50 shadow-sm shadow-[#f97316]/20",
  Advanced: "bg-[#ec4899]/35 text-[#7b1a3d] border-[#ec4899]/50 shadow-sm shadow-[#ec4899]/20",
};

const EVENT_BADGE_STYLES: Record<number, string> = {
  0: "bg-[#B4E3BD]/35 text-[#1a6b3d] border-[#B4E3BD]/50 shadow-sm shadow-[#B4E3BD]/20",
  1: "bg-[#B4E3BD]/35 text-[#1a6b3d] border-[#B4E3BD]/50 shadow-sm shadow-[#B4E3BD]/20",
  2: "bg-[#B4E3BD]/35 text-[#1a6b3d] border-[#B4E3BD]/50 shadow-sm shadow-[#B4E3BD]/20",
  3: "bg-[#B4E3BD]/35 text-[#1a6b3d] border-[#B4E3BD]/50 shadow-sm shadow-[#B4E3BD]/20",
  4: "bg-[#B4E3BD]/35 text-[#1a6b3d] border-[#B4E3BD]/50 shadow-sm shadow-[#B4E3BD]/20",
  5: "bg-[#B4E3BD]/35 text-[#1a6b3d] border-[#B4E3BD]/50 shadow-sm shadow-[#B4E3BD]/20",
  6: "bg-[#B4E3BD]/35 text-[#1a6b3d] border-[#B4E3BD]/50 shadow-sm shadow-[#B4E3BD]/20",
  7: "bg-[#B4E3BD]/35 text-[#1a6b3d] border-[#B4E3BD]/50 shadow-sm shadow-[#B4E3BD]/20",
  8: "bg-[#B4E3BD]/35 text-[#1a6b3d] border-[#B4E3BD]/50 shadow-sm shadow-[#B4E3BD]/20",
  9: "bg-[#B4E3BD]/35 text-[#1a6b3d] border-[#B4E3BD]/50 shadow-sm shadow-[#B4E3BD]/20",
};

function LevelBadge({ level }: { level: string }) {
  return (
    <span className={`inline-block rounded-full border px-2 sm:px-3 py-0.5 text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider ${LEVEL_BADGE_STYLES[level] || ""}`}>
      {level}
    </span>
  );
}

function EventBadge({ event }: { event: number }) {
  const label = event === 0 ? "Total" : `Ev ${event}`;
  return (
    <span className={`inline-block rounded-full border px-2 sm:px-3 py-0.5 text-[9px] sm:text-[11px] font-semibold tracking-wider ${EVENT_BADGE_STYLES[event] || ""}`}>
      {label}
    </span>
  );
}

/* ─── Time display — every heat shows a compact start-end range
   ("8:00-8:12") built from its start and end times, keeping the rows
   tidy at every width. Hovering a range reveals the full times. ───── */
function formatHeatRange(time: string, end: string): string {
  const [t, m] = time.split(" ");
  const [e, em] = end.split(" ");
  // Same meridiem (or missing) → compact "8:00-8:12". Otherwise spell both out.
  return m == null || m === em || em == null ? `${t}-${e}` : `${t} ${m} – ${e} ${em}`;
}

function TimeCell({ time, end }: { time: string; end: string }) {
  return (
    <span
      className="flex items-center justify-end gap-1.5 text-xs font-bold tabular-nums text-white sm:text-sm"
      title={`${time} – ${end}`}
    >
      <span className="text-[#B4E3BD]">
        <IconClock />
      </span>
      {formatHeatRange(time, end)}
    </span>
  );
}

/* ─── Day accordion — each DAY is the main row. Clicking a day expands
   it and reveals every event and heat, one row per heat (event · heat ·
   start time). The header follows the page direction; the expanded table
   is pinned to LTR so columns read in the same order in EN and FA. ─── */
function DaySchedule({
  t,
  day,
  index,
  open,
  onToggle,
}: {
  t: (key: string) => string;
  day: CompetitionDay;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const heatCount = day.events.reduce((sum, e) => sum + e.heats.length, 0);
  const eventCount = day.events.length;

  return (
    <div
      style={{ animationDelay: `${index * 90}ms` }}
      className={`group overflow-hidden rounded-2xl border opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] shadow-lg shadow-black/40 transition-all duration-300 ${
        open
          ? "border-[#B4E3BD]/50 bg-gradient-to-br from-[#1c1c1c] to-[#141414] shadow-xl shadow-[#B4E3BD]/15"
          : "border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#121212] hover:border-[#B4E3BD]/40 hover:shadow-xl hover:shadow-[#B4E3BD]/10"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${day.id}-panel`}
        className="relative flex w-full items-center gap-3 px-4 py-4 text-start sm:gap-5 sm:px-6 sm:py-5 focus-visible:ring-2 focus-visible:ring-[#B4E3BD]/60"
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B4E3BD]/40 to-transparent opacity-60 transition-opacity duration-300" />

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-base font-black transition-all duration-300 sm:h-14 sm:w-14 sm:text-xl ${
            open
              ? "border-[#B4E3BD] bg-[#B4E3BD] text-black shadow-lg shadow-[#B4E3BD]/40"
              : "border-[#B4E3BD]/40 bg-[#B4E3BD]/10 text-[#B4E3BD] group-hover:border-[#B4E3BD] group-hover:bg-[#B4E3BD]/20"
          }`}
        >
          {day.day}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold uppercase tracking-[0.14em] text-white sm:text-base">
            {t("schedule.day")} {day.day}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-gray-400 sm:text-xs">
            <span className="inline-flex items-center gap-1.5 text-[#B4E3BD]/80">
              <IconCalendarSmall />
              {day.date}
            </span>
            <span className="text-gray-600">•</span>
            <span>
              {eventCount} {t("schedule.events")}
            </span>
            <span className="text-gray-600">•</span>
            <span>
              {heatCount} {t("schedule.heats")}
            </span>
          </span>
        </span>

        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-[#B4E3BD]" : "text-gray-500 group-hover:text-[#B4E3BD]"}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div id={`${day.id}-panel`} className="min-h-0 overflow-hidden">
          <div dir="ltr" className="border-t border-white/5 bg-black/30 px-3 pb-4 pt-3 sm:px-6 sm:pb-5">
            <div className="grid grid-cols-[minmax(0,1.7fr)_auto_minmax(0,1fr)] items-center gap-3 px-2 pb-2 sm:grid-cols-[minmax(0,2fr)_auto_minmax(0,1fr)] sm:px-3">
              <span className="text-start text-[9px] font-bold uppercase tracking-[0.2em] text-[#B4E3BD]/70 sm:text-[11px]">{t("schedule.event")}</span>
              <span className="w-16 text-start text-[9px] font-bold uppercase tracking-[0.2em] text-[#B4E3BD]/70 sm:w-20 sm:text-[11px]">{t("schedule.heat")}</span>
              <span className="text-end text-[9px] font-bold uppercase tracking-[0.2em] text-[#B4E3BD]/70 sm:text-[11px]">{t("schedule.time")}</span>
            </div>

            {day.events.map((event, ei) =>
              event.heats.map((heat) => (
                <div
                  key={`${day.id}-e${ei}-h${heat.heat}`}
                  className="grid grid-cols-[minmax(0,1.7fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-lg border-t border-white/5 px-2 py-2 transition-colors duration-200 hover:bg-[#B4E3BD]/[0.06] sm:grid-cols-[minmax(0,2fr)_auto_minmax(0,1fr)] sm:px-3 sm:py-2.5"
                >
                  <span className="min-w-0">
                    <span className="flex items-baseline gap-1.5">
                      <span className="truncate text-xs font-semibold text-white sm:text-sm">{t("schedule.event")}</span>
                      <span className="shrink-0 text-base font-black leading-none text-[#B4E3BD] sm:text-lg">{ei + 1}</span>
                    </span>
                    <span className="block truncate text-[10px] text-gray-500 sm:text-xs">{event.name}</span>
                  </span>

                  <span className="inline-flex w-16 sm:w-20 items-center justify-center rounded-full border border-[#B4E3BD]/20 bg-[#B4E3BD]/10 px-2 py-1 text-[10px] sm:text-xs font-semibold whitespace-nowrap text-[#B4E3BD]">
                    {t("schedule.heat")} {heat.heat}
                  </span>

                  <TimeCell time={heat.time} end={heat.end} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Day accordion list — only ONE day stays open at a time, so the
   schedule stays compact and predictable: opening a day closes any
   other open day. The list remounts per level via `key`, which also
   resets the open state when switching Beginner/Intermediate/Advanced. */
function DayScheduleList({
  t,
  days,
}: {
  t: (key: string) => string;
  days: CompetitionDay[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:gap-4">
      {days.map((day, i) => (
        <DaySchedule
          key={day.id}
          t={t}
          index={i}
          day={day}
          open={openId === day.id}
          onToggle={() => setOpenId((cur) => (cur === day.id ? null : day.id))}
        />
      ))}
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
  options: { value: string | number; label: string }[];
  selected: string | number;
  onSelect: (val: string | number) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const isOutside =
        btnRef.current && !btnRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target);
      if (isOutside) setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", handler);
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setPosition({ top: rect.bottom + 4, left: Math.max(4, rect.left) });
      }
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const currentLabel =
    options.find((o) => o.value === selected)?.label ?? label;

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-bold uppercase tracking-[0.12em] sm:tracking-[0.15em] transition-all duration-200 ${
          "bg-[#B4E3BD]/10 text-[#B4E3BD]"
        }`}
      >
        {currentLabel}
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && position && (
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            zIndex: 9999,
          }}
          className="min-w-[120px] sm:min-w-[160px] rounded-xl border border-gray-200 bg-white py-1 shadow-xl shadow-black/5"
        >
          {options.map((opt) => {
            const isActive = selected === opt.value;
            return (
              <button
                key={String(opt.value)}
                onClick={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm transition-colors ${
                  isActive ? "bg-[#B4E3BD]/10 font-semibold text-[#B4E3BD]" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {isActive && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="shrink-0 text-[#B4E3BD]">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                <span className={isActive ? "" : "ml-5 sm:ml-6"}>{opt.label}</span>
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
  const [levelFilter, setLevelFilter] = useState<string>("Beginner");
  const [eventFilter, setEventFilter] = useState<number>(0); // 0 = Total (sum of all events)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [showAthletesOpen, setShowAthletesOpen] = useState(false);
  const [showAthletesReadOnly, setShowAthletesReadOnly] = useState(false);
  const [showAthletesInitialName, setShowAthletesInitialName] = useState<string | null>(null);

  function openAthleteDetails(name: string) {
    setShowAthletesInitialName(name);
    setShowAthletesReadOnly(true);
    setShowAthletesOpen(true);
  }

  function closeShowAthletes() {
    setShowAthletesOpen(false);
    setShowAthletesReadOnly(false);
    setShowAthletesInitialName(null);
  }

  // Load leaderboard data from the API
  const loadLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const params = new URLSearchParams();
      params.set("level", levelFilter);
      if (eventFilter !== 0) params.set("event", String(eventFilter));
      const qs = params.toString();
      const data = await api.get<{ athletes: AthleteFromApi[] }>(
        `/competition-athletes?${qs}`
      );
      if (eventFilter === 0) {
        // Aggregate: sum every athlete's scores across all events
        const summed = new Map<string, { level: string; score: number }>();
        for (const a of data.athletes) {
          if (a.score !== null) {
            const cur = summed.get(a.name) ?? { level: a.level, score: 0 };
            cur.score += a.score;
            // level should be consistent; pick whichever we saw first
            summed.set(a.name, cur);
          }
        }
        setLeaderboard(
          Array.from(summed.entries()).map(([name, s]) => ({
            id: 0,
            name,
            level: s.level,
            event: 0,
            score: s.score,
            tiebreaker_type: null,
            tiebreaker_value: null,
          }))
        );
      } else {
        setLeaderboard(
          data.athletes.map((a) => ({
            id: a.id,
            name: a.name,
            level: a.level,
            event: a.event,
            score: a.score,
            tiebreaker_type: a.tiebreaker_type,
            tiebreaker_value: a.tiebreaker_value,
          }))
        );
      }
    } catch {
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [levelFilter, eventFilter]);

  // Fetch on mount + when filters change
  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const filtered = leaderboard
    .filter((r) => r.level === levelFilter)
    .filter((r) => eventFilter === 0 || r.event === eventFilter)
    .sort((a, b) => {
      const s = (b.score ?? 0) - (a.score ?? 0);
      if (s !== 0) return s;
      // Time tiebreakers rank by LOWEST time; everything else by highest value.
      const bothTime = a.tiebreaker_type === "time" && b.tiebreaker_type === "time";
      return bothTime
        ? (a.tiebreaker_value ?? 0) - (b.tiebreaker_value ?? 0)
        : (b.tiebreaker_value ?? 0) - (a.tiebreaker_value ?? 0);
    })
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
    <main className="min-h-screen bg-black text-white">
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

          {/* Tap hint — keeps the accordion behaviour obvious */}
          <div className="mb-6 flex justify-center sm:mb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] text-gray-400 sm:text-xs">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#B4E3BD]">
                <path d="M9 18l6-6-6-6" />
              </svg>
              {t("schedule.hint")}
            </span>
          </div>

          {/* Day accordions. `key` remounts the list on level change so
              the staggered fade-in replays. */}
          <DayScheduleList key={activeLevel} t={t} days={SCHEDULE[activeLevel]} />

          <div className="mt-10 flex justify-center sm:mt-12">
            <BackToTop onClick={() => scrollTo("hero")} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SCORES SECTION (جدول امتیازات)
      ════════════════════════════════════════════════════════════════ */}
      <section id="section-scores" className="relative overflow-hidden min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 px-6 py-24 sm:px-12">
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

          {/* Add Athlete button bar */}
          <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              {loadingLeaderboard && (
                <span className="text-sm text-gray-400">Loading…</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAthletesReadOnly(false);
                  setShowAthletesInitialName(null);
                  setShowAthletesOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#B4E3BD] px-5 py-2.5 text-sm font-semibold text-[#B4E3BD] transition-all hover:bg-[#B4E3BD] hover:text-black active:scale-[0.98]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Show Athletes
              </button>
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#B4E3BD] px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-[#a3dcae] active:scale-[0.98]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Athlete
              </button>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/80">
            <table className="w-full min-w-[480px] sm:min-w-0">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-3 sm:px-5 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-gray-500 first:pl-4 sm:first:pl-6">#</th>
                  <th className="px-3 sm:px-5 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-gray-500">Name</th>
                  <th className="px-3 sm:px-5 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
                    <FilterDropdown
                      label="Level"
                      options={[
                        { value: "Beginner", label: "Beginner" },
                        { value: "Intermediate", label: "Intermediate" },
                        { value: "Advanced", label: "Advanced" },
                      ]}
                      selected={levelFilter}
                      onSelect={(v) => setLevelFilter(v as string)}
                    />
                  </th>
                  <th className="px-3 sm:px-5 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
                    <FilterDropdown
                      label="Event"
                      options={[
                        { value: 0, label: "Total" },
                        { value: 1, label: "Event 1" },
                        { value: 2, label: "Event 2" },
                        { value: 3, label: "Event 3" },
                        { value: 4, label: "Event 4" },
                        { value: 5, label: "Event 5" },
                        { value: 6, label: "Event 6" },
                        { value: 7, label: "Event 7" },
                        { value: 8, label: "Event 8" },
                        { value: 9, label: "Event 9" },
                      ]}
                      selected={eventFilter}
                      onSelect={(v) => setEventFilter(v as number)}
                    />
                  </th>
                  <th className="px-3 sm:px-5 py-3 sm:py-4 text-right text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-gray-500 last:pr-4 sm:last:pr-6">Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-10 sm:py-12 text-center text-sm text-gray-400">
                      No results match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => {
                    const badge =
                      row.place === 1
                        ? "bg-[#FFD700]/35 text-[#8B6914] border-[#FFD700]/50 shadow-sm shadow-[#FFD700]/30"
                        : row.place === 2
                          ? "bg-[#C0C0C0]/35 text-[#4A4A4A] border-[#C0C0C0]/50 shadow-sm shadow-[#C0C0C0]/30"
                          : row.place === 3
                            ? "bg-[#CD7F32]/35 text-[#5C3317] border-[#CD7F32]/50 shadow-sm shadow-[#CD7F32]/30"
                            : "text-gray-500";

                    const rowBg =
                      row.place === 1
                        ? "bg-[#FFD700]/[0.08] hover:bg-[#FFD700]/[0.12]"
                        : row.place === 2
                          ? "bg-[#C0C0C0]/[0.08] hover:bg-[#C0C0C0]/[0.12]"
                          : row.place === 3
                            ? "bg-[#CD7F32]/[0.08] hover:bg-[#CD7F32]/[0.12]"
                            : "hover:bg-[#B4E3BD]/5";

                    return (
                      <tr key={`${row.name}-${row.event}`} className={`border-b border-gray-100 transition-colors duration-200 last:border-0 ${rowBg}`}>
                        <td className="px-3 sm:px-5 py-3 sm:py-4 first:pl-4 sm:first:pl-6">
                          <span className={`inline-flex items-center justify-center rounded-lg px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs sm:text-sm font-black tabular-nums ${badge}`}>
                            {row.place}
                          </span>
                        </td>
                        <td className="px-3 sm:px-5 py-3 sm:py-4">
                          <button
                            type="button"
                            onClick={() => openAthleteDetails(row.name)}
                            title={`View ${row.name}'s results`}
                            className="block max-w-[100px] truncate text-left text-xs sm:text-sm font-semibold text-gray-900 underline-offset-4 transition hover:text-[#1a6b3d] hover:underline sm:max-w-none"
                          >
                            {row.name}
                          </button>
                        </td>
                        <td className="px-3 sm:px-5 py-3 sm:py-4"><LevelBadge level={row.level} /></td>
                        <td className="px-3 sm:px-5 py-3 sm:py-4"><EventBadge event={row.event} /></td>
                        <td className="px-3 sm:px-5 py-3 sm:py-4 text-right text-xs sm:text-sm font-bold tabular-nums text-gray-900 last:pr-4 sm:last:pr-6 whitespace-nowrap">
                          {row.score !== null ? row.score.toLocaleString() : <span className="text-gray-300">—</span>}
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

      <AddAthleteModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSaved={() => {
          loadLeaderboard();
        }}
      />
      <ShowAthletesModal
        open={showAthletesOpen}
        onClose={closeShowAthletes}
        onDataChanged={() => {
          loadLeaderboard();
        }}
        readOnly={showAthletesReadOnly}
        initialName={showAthletesInitialName}
      />
    </main>
  );
}