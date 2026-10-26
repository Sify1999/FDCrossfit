"use client";

import { COMPETITION_EVENT_NUMBERS, COMPETITION_DAY_EVENT_GROUPS, eventLabel } from "@/lib/competition-events";
import { dayDateLabel } from "@/lib/competition-days";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { api } from "@/lib/api-client";
import { fetchCurrentUser, type CurrentUser } from "@/lib/auth";
import AddAthleteModal from "../components/AddAthleteModal";
import ShowAthletesModal from "../components/ShowAthletesModal";
import ScheduleManagerModal from "../components/ScheduleManagerModal";
import RuleBookModal from "../components/RuleBookModal";
import { useCallback, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

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

/* ─── Open-book icon (Rule Book section header & day cards) ──────── */
function IconBook() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
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

/* ─── Schedule types + dynamic builders ─────────────────────────────
   The schedule now lives in the database (events + heats with times),
   loaded from /api/competition/schedule and grouped into day cards. */
type Heat = {
  heat: number;
  time: string;
  /** End time — the heat renders as a compact range, e.g. "8:00-8:12" */
  end: string;
  /** Athletes registered in this heat (from the dynamic schedule). */
  athletes?: string[];
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

type ScheduleHeatApi = {
  id: number;
  heat_number: number;
  start_time: string;
  end_time: string;
  athletes: string[];
};

type ScheduleEventApi = {
  id: number;
  level: string;
  event_number: number;
  name: string;
  day: number | null;
  date: string | null;
  heats: ScheduleHeatApi[];
};

/** "08:00" → "8:00 AM" */
function formatTime12h(value: string): string {
  const [hhRaw, mmRaw] = value.split(":");
  const hh = parseInt(hhRaw, 10);
  const mm = mmRaw ?? "00";
  const period = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 || 12;
  return `${h12}:${mm} ${period}`;
}

/** Group dynamic schedule events into the day-card shape the UI renders. */
function buildScheduleDays(events: ScheduleEventApi[]): CompetitionDay[] {
  const days = new Map<number, CompetitionDay>();
  for (const e of events) {
    const dayNum = e.day ?? 1;
    let day = days.get(dayNum);
    if (!day) {
      day = { id: `${e.level}-day-${dayNum}`, day: dayNum, date: e.date ?? "", events: [] };
      days.set(dayNum, day);
    }
    day.events.push({
      name: e.name,
      heats: e.heats.map((h) => ({
        heat: h.heat_number,
        time: formatTime12h(h.start_time),
        end: formatTime12h(h.end_time),
        athletes: h.athletes ?? [],
      })),
    });
  }
  return [...days.values()].sort((a, b) => a.day - b.day);
}

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
  reps: number | null;
  weight: number | null;
  score_2: number | null;
  reps_2: number | null;
  weight_2: number | null;
  tiebreaker_type: string | null;
  tiebreaker_value: number | null;
  tiebreaker_value_2: number | null;
  created_at: string;
  updated_at: string;
};

/* Level colors match the difficulty icons: mint / orange / blue. */
const LEVEL_BADGE_STYLES: Record<string, string> = {
  Beginner: "bg-[#B4E3BD]/10 text-[#B4E3BD] border-[#B4E3BD]/30",
  Intermediate: "bg-[#ff8c42]/10 text-[#ff8c42] border-[#ff8c42]/30",
  Advanced: "bg-[#8ab4f8]/10 text-[#8ab4f8] border-[#8ab4f8]/30",
};

const EVENT_BADGE_STYLE = "bg-white/5 text-gray-300 border-white/10";

function LevelBadge({ level }: { level: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider sm:px-3 sm:text-[11px] ${LEVEL_BADGE_STYLES[level] || ""}`}>
      {level}
    </span>
  );
}

function EventBadge({ event }: { event: number }) {
  const label =
    event === 0
      ? "Total"
      : event === 1
        ? "Event 1"
        : event === 2
          ? "Event 2"
          : eventLabel(event);
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-wider sm:px-3 sm:text-[11px] ${EVENT_BADGE_STYLE}`}>
      {label}
    </span>
  );
}

/* ─── Time display — compact range. When start and end share AM/PM it is
   shown once ("10:00 – 10:30 AM"); otherwise both are spelled out
   ("11:30 AM – 12:00 PM"). Thin spaces keep it tight. */
function formatHeatRange(time: string, end: string): string {
  const [t1, m1] = time.split(" ");
  const [t2, m2] = end.split(" ");
  const sep = "\u2009–\u2009";
  if (!m1 || !m2 || m1 === m2) return `${t1}${sep}${t2}${m2 ? ` ${m2}` : ""}`;
  return `${t1} ${m1}${sep}${t2} ${m2}`;
}

function TimeCell({ time, end }: { time: string; end: string }) {
  return (
    <span
      className="flex items-center justify-end gap-1.5 whitespace-nowrap text-[11px] font-bold tabular-nums text-white sm:text-sm"
      title={`${time} – ${end}`}
    >
      <span className="hidden text-[#B4E3BD] sm:inline-flex">
        <IconClock />
      </span>
      {formatHeatRange(time, end)}
    </span>
  );
}


/* ─── Day accordion — each DAY is the main row. Clicking a day expands
   it and reveals every event and heat, one row per athlete.
   The table uses FIXED-width heat/time columns (identical in the header
   and every row) so longer times like "10:00 – 10:30 AM" can never push
   the layout around. On phones the event name moves under the athlete. */
const SCHEDULE_GRID =
  "grid grid-cols-[minmax(0,1fr)_3.25rem_7.25rem] items-center gap-2 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_4rem_10rem] sm:gap-3";

function DaySchedule({
  t,
  day,
  index,
  open,
  onToggle,
  locale,
}: {
  t: (key: string) => string;
  day: CompetitionDay;
  index: number;
  open: boolean;
  onToggle: () => void;
  locale: string;
}) {
  const heatCount = day.events.reduce((sum, e) => sum + e.heats.length, 0);
  const eventCount = day.events.length;
  const dayLabel = dayDateLabel(day.day, locale as "en" | "fa");

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
              {dayLabel}
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
            {/* Header row — same grid as the data rows */}
            <div className={`${SCHEDULE_GRID} px-2 pb-2 sm:px-3`}>
              <span className="text-start text-[9px] font-bold uppercase tracking-[0.2em] text-[#B4E3BD]/70 sm:text-[11px]">
                {t("schedule.athlete")}
              </span>
              <span className="hidden text-start text-[9px] font-bold uppercase tracking-[0.2em] text-[#B4E3BD]/70 sm:block sm:text-[11px]">
                {t("schedule.event")}
              </span>
              <span className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-[#B4E3BD]/70 sm:text-[11px]">
                {t("schedule.heat")}
              </span>
              <span className="text-end text-[9px] font-bold uppercase tracking-[0.2em] text-[#B4E3BD]/70 sm:text-[11px]">
                {t("schedule.time")}
              </span>
            </div>

            {day.events.map((event, ei) =>
              event.heats.map((heat) => {
                const athletes = heat.athletes ?? [];
                // One row per athlete — empty heats get a placeholder row so the
                // Heat 1..N sequence stays visible.
                const names: (string | null)[] = athletes.length > 0 ? [...athletes].sort() : [null];
                return names.map((athleteName, ai) => {
                  const isFirstOfEvent = ai === 0 && ei !== 0;
                  return (
                    <div
                      key={`${day.id}-e${ei}-h${heat.heat}-a${ai}`}
                      className={`${SCHEDULE_GRID} rounded-lg border-t px-2 py-2 transition-colors duration-200 hover:bg-[#B4E3BD]/[0.06] sm:px-3 sm:py-2.5 ${
                        isFirstOfEvent ? "mt-1.5 border-[#B4E3BD]/30" : "border-white/5"
                      }`}
                    >
                      {/* Athlete (+ event subtitle on phones) */}
                      <span className="min-w-0">
                        {athleteName ? (
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#B4E3BD]/15 text-[9px] font-bold uppercase text-[#B4E3BD]">
                              {athleteName.slice(0, 2)}
                            </span>
                            <span className="truncate text-xs font-semibold text-white sm:text-sm">{athleteName}</span>
                          </span>
                        ) : (
                          <span className="block truncate text-[11px] italic text-gray-600">No athletes in this heat</span>
                        )}
                        <span className="mt-0.5 block truncate text-[10px] font-medium text-gray-500 sm:hidden">
                          {event.name}
                        </span>
                      </span>

                      {/* Event (desktop column) */}
                      <span className="hidden truncate text-xs font-medium text-gray-400 sm:block">{event.name}</span>

                      {/* Heat badge */}
                      <span className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[#B4E3BD]/20 bg-[#B4E3BD]/10 px-1 py-1 text-[10px] font-semibold text-[#B4E3BD] sm:px-2 sm:text-xs">
                        {t("schedule.heat")} {heat.heat}
                      </span>

                      {/* Time */}
                      <TimeCell time={heat.time} end={heat.end} />
                    </div>
                  );
                });
              })
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
  locale,
}: {
  t: (key: string) => string;
  days: CompetitionDay[];
  locale: string;
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
          locale={locale}
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
      <h2 className="mb-16 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
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

/* ─── Rule Book day cards — one card per competition day. Clicking a
   card opens the Rule Book popup already scrolled to that day's chapter. */
function RuleBookDayCard({
  t,
  day,
  locale,
  onOpen,
}: {
  t: (key: string) => string;
  day: number;
  locale: string;
  onOpen: (day: number) => void;
}) {
  const dateLabel = dayDateLabel(day, locale as "en" | "fa");
  const dayEvents = COMPETITION_DAY_EVENT_GROUPS[day] ?? [];

  return (
    <button
      type="button"
      onClick={() => onOpen(day)}
      aria-label={`${t("schedule.day")} ${day} — ${dateLabel}`}
      className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#121212] p-5 text-start shadow-lg shadow-black/40 transition-all duration-300 hover:-translate-y-1 hover:border-[#B4E3BD]/50 hover:shadow-xl hover:shadow-[#B4E3BD]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4E3BD]/60 sm:p-6"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B4E3BD]/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-center justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#B4E3BD]/40 bg-[#B4E3BD]/10 text-lg font-black text-[#B4E3BD] transition-all duration-300 group-hover:border-[#B4E3BD] group-hover:bg-[#B4E3BD] group-hover:text-black sm:h-14 sm:w-14 sm:text-xl">
          {day}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {t("schedule.day")}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">{dateLabel}</p>
        <h3 className="mt-1 text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
          {t("schedule.day")} {day}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">{t("ruleBook.card.tagline")}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {dayEvents.map((ev) => (
          <span
            key={ev}
            className="rounded-full border border-[#B4E3BD]/20 bg-[#B4E3BD]/10 px-2.5 py-1 text-[10px] font-semibold text-[#B4E3BD] sm:text-[11px]"
          >
            {eventLabel(ev)}
          </span>
        ))}
      </div>

      <span className="mt-5 inline-flex items-center gap-1.5 border-t border-white/10 pt-4 text-xs font-semibold text-[#B4E3BD] transition-colors duration-300 group-hover:text-[#a3dcae]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
        {t("ruleBook.card.open")}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:-scale-x-100 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    </button>
  );
}

/* ─── Filter dropdown for the scores table headers ────────────────── */
/* ─── Filter dropdown for the scores table headers ──────────────────
   The menu is rendered in a portal on <body>, so it can never be clipped
   by the scoreboard's overflow containers. It opens downward by default,
   flips upward when there isn't room below, and caps its height to the
   space that is actually available. */
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
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);

  const place = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const margin = 8; // keep clear of the viewport edge
    const gap = 4; // space between button and menu
    const desiredMax = 288;
    const menuWidth = 170;

    const spaceBelow = window.innerHeight - rect.bottom - margin - gap;
    const spaceAbove = rect.top - margin - gap;
    const naturalHeight = Math.min(desiredMax, options.length * 40 + 8);

    // Flip up only when it doesn't fit below AND there's more room above.
    const openUp = spaceBelow < naturalHeight && spaceAbove > spaceBelow;
    const available = openUp ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(120, Math.min(desiredMax, available));

    const left = Math.max(margin, Math.min(rect.left, window.innerWidth - menuWidth - margin));

    setMenuStyle({
      position: "fixed",
      left,
      maxHeight,
      zIndex: 9999,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
    });
  }, [options.length]);

  useEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }

    place();

    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setOpen(false);
    }

    // A fixed menu would drift away from its button if the page scrolled,
    // so close it — but ignore scrolling inside the menu itself.
    function onScroll(e: Event) {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }

    function onResize() {
      setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, place]);

  const currentLabel =
    options.find((o) => o.value === selected)?.label ?? label;

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-200 sm:px-3 sm:py-1.5 sm:text-xs sm:tracking-[0.15em] ${
          open
            ? "border-[#B4E3BD] bg-[#B4E3BD] text-black"
            : "border-[#B4E3BD]/30 bg-[#B4E3BD]/10 text-[#B4E3BD] hover:border-[#B4E3BD]/60 hover:bg-[#B4E3BD]/20"
        }`}
      >
        {currentLabel}
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open &&
        menuStyle &&
        createPortal(
          <div
            ref={dropdownRef}
            dir="ltr"
            role="listbox"
            style={menuStyle}
            className="coach-scroll min-w-[140px] overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-[#1a1a1a] p-1 shadow-2xl shadow-black/60 [scrollbar-width:thin] sm:min-w-[170px]"
          >
            {options.map((opt) => {
              const isActive = selected === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onSelect(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs normal-case tracking-normal transition-colors sm:text-sm ${
                    isActive
                      ? "bg-[#B4E3BD]/15 font-semibold text-[#B4E3BD]"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex h-3 w-3 shrink-0 items-center justify-center">
                    {isActive && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>,
          document.body
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
  // Admin-only controls (Schedule manager / Add Athlete / Show Athletes list).
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const isAdmin = currentUser?.role === "admin";

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

  // Athlete whose registration is currently being edited (events/heats).
  const [editingAthlete, setEditingAthlete] = useState<{
    name: string;
    level: string;
    events: { event: number; heat: number | null }[];
  } | null>(null);

  function handleEditAthlete(data: {
    name: string;
    level: string;
    events: { event: number; heat: number | null }[];
  }) {
    setShowAthletesOpen(false);
    setEditingAthlete(data);
    setAddModalOpen(true);
  }

  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Rule Book popup — targetDay decides which chapter is scrolled into view.
  const [ruleBookOpen, setRuleBookOpen] = useState(false);
  const [ruleBookTargetDay, setRuleBookTargetDay] = useState(1);

  function openRuleBook(day: number) {
    setRuleBookTargetDay(day);
    setRuleBookOpen(true);
  }
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleByLevel, setScheduleByLevel] = useState<Record<LevelKey, CompetitionDay[]>>({
    beginner: [],
    intermediate: [],
    advanced: [],
  });

  // Load the dynamic schedule (events + heats + times) from the API.
  const loadSchedule = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const res = await api.get<{ events: ScheduleEventApi[] }>("/competition/schedule");
      const byLevel: Record<LevelKey, CompetitionDay[]> = { beginner: [], intermediate: [], advanced: [] };
      for (const key of Object.keys(byLevel) as LevelKey[]) {
        byLevel[key] = buildScheduleDays(res.events.filter((e) => e.level === key));
      }
      setScheduleByLevel(byLevel);
    } catch {
      setScheduleByLevel({ beginner: [], intermediate: [], advanced: [] });
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Load the current user once so admin-only controls can be gated.
  // Logged-out visitors just get null → no admin controls, ever.
  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser().then((u) => {
      if (cancelled) return;
      setCurrentUser(u);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load leaderboard data from the API
  const loadLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const params = new URLSearchParams();
      params.set("level", levelFilter);
      // Events 1 & 2 are the two scored parts of the combined "Event 1&2" entry —
      // fetch all the level's entries and split them client-side.
      if (eventFilter >= 3) params.set("event", String(eventFilter));
      const qs = params.toString();
      const data = await api.get<{ athletes: AthleteFromApi[] }>(
        `/competition-athletes?${qs}`
      );
      if (eventFilter === 0) {
        // Aggregate: sum every athlete's scores across all events.
        // The combined Event 1&2 entry contributes both of its parts.
        const summed = new Map<string, { level: string; score: number }>();
        for (const a of data.athletes) {
          const cur = summed.get(a.name) ?? { level: a.level, score: 0 };
          cur.score += (a.score ?? 0) + (a.score_2 ?? 0);
          summed.set(a.name, cur);
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
      } else if (eventFilter === 1 || eventFilter === 2) {
        // Events 1 & 2 are the two scored parts of the combined "Event 1&2" entry —
        // split its score into two separate leaderboard rows.
        setLeaderboard(
          data.athletes
            .filter((a) => a.event === 1)
            .map((a) => ({
              id: a.id,
              name: a.name,
              level: a.level,
              event: eventFilter,
              score: eventFilter === 1 ? a.score : a.score_2,
              tiebreaker_type: "time",
              tiebreaker_value: eventFilter === 1 ? a.tiebreaker_value : a.tiebreaker_value_2,
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
    // Hide athletes with 0 points (and athletes who haven't scored yet).
    .filter((r) => (r.score ?? 0) > 0)
    .sort((a, b) => {
      // Ascending points — the LOWEST score ranks #1 (e.g. #1 has 1 point, #2 has 3).
      const s = (a.score ?? 0) - (b.score ?? 0);
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
              {/* <ActionButton
                icon={<IconSignIn />}
                label={t("hero.btnSignIn")}
                desc="Register to compete"
                highlight
                onClick={() => scrollTo("section-signIn")}
              /> */}
              <ActionButton
                icon={<IconSignIn />}
                label={t("hero.ruleBook")}
                desc="Rule Book"
                highlight
                onClick={() => scrollTo("section-ruleBook")}
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
      {/* <section id="section-signIn" className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black px-6 py-24 sm:px-12">
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
      </section> */}
      {/* ════════════════════════════════════════════════════════════════
          RULE BOOK SECTION (قوانین)
          Four day cards — tapping a card opens the Rule Book popup and
          scrolls it straight to that day's chapter.
      ════════════════════════════════════════════════════════════════ */}
      <section id="section-ruleBook" className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black px-6 py-24 sm:px-12">
        <div aria-hidden className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#B4E3BD]/50 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-24 -z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[#B4E3BD]/10 blur-3xl" />
        <div className="relative z-10 w-full">
          <SectionHeader
            icon={<IconBook />}
            eyebrow={t("hero.btnRuleBook")}
            title={t("ruleBook.title")}
            description={t("ruleBook.description")}
          />

          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {[1, 2, 3, 4].map((day) => (
              <RuleBookDayCard key={day} t={t} day={day} locale={locale} onOpen={openRuleBook} />
            ))}
          </div>

          <div className="mt-12 flex justify-center">
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
          {scheduleLoading ? (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:gap-4">
              <p className="py-8 text-center text-sm text-gray-500">Loading schedule…</p>
            </div>
          ) : (scheduleByLevel[activeLevel] ?? []).length === 0 ? (
            <div className="mx-auto w-full max-w-3xl rounded-2xl border border-dashed border-gray-700/60 py-12 text-center">
              <p className="text-sm font-semibold text-gray-300">No events scheduled yet</p>
              <p className="mt-1 text-xs text-gray-500">
                {isAdmin
                  ? "Add events, heats & times from the Schedule manager."
                  : "Events and their heats will appear here once they're scheduled."}
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setScheduleOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#B4E3BD]/60 px-5 py-2 text-sm font-semibold text-[#B4E3BD] transition hover:bg-[#B4E3BD]/10"
                >
                  Manage schedule
                </button>
              )}
            </div>
          ) : (
            <DayScheduleList key={activeLevel} t={t} days={scheduleByLevel[activeLevel] ?? []} locale={locale} />
          )}

          <div className="mt-10 flex justify-center sm:mt-12">
            <BackToTop onClick={() => scrollTo("hero")} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SCORES SECTION (جدول امتیازات)
      ════════════════════════════════════════════════════════════════ */}
      <section id="section-scores" className="relative min-h-screen w-full overflow-hidden bg-black px-4 py-20 sm:px-12 sm:py-24">
        <div aria-hidden className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#B4E3BD]/40 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#B4E3BD]/[0.06] blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#B4E3BD]/[0.04] blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <SectionHeader
            icon={<IconScores />}
            eyebrow={t("hero.btnScores")}
            title={t("scores.title")}
            description={t("scores.description")}
          />

          {/* Action bar — pinned LTR so RTL/FA mode keeps the same layout */}
          <div dir="ltr" className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-h-[20px]">
              {loadingLeaderboard && (
                <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#B4E3BD]/30 border-t-[#B4E3BD]" />
                  Loading…
                </span>
              )}
            </div>
            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setScheduleOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-gray-300 transition-all hover:border-white/30 hover:bg-white/[0.07] hover:text-white active:scale-[0.98] sm:px-5"
              >
                <IconCalendarSmall />
                Schedule
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAthletesReadOnly(false);
                  setShowAthletesInitialName(null);
                  setShowAthletesOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[#B4E3BD]/50 px-4 py-2.5 text-sm font-semibold text-[#B4E3BD] transition-all hover:bg-[#B4E3BD]/10 active:scale-[0.98] sm:px-5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Show Athletes
              </button>
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#B4E3BD] px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-[#B4E3BD]/20 transition-all hover:bg-[#a3dcae] hover:shadow-[#B4E3BD]/30 active:scale-[0.98] sm:px-5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Athlete
              </button>
              </div>
            )}
          </div>

          {/* Leaderboard card — pinned LTR so FA mode never flips/breaks it */}
          <div dir="ltr" className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#121212] shadow-xl shadow-black/50">
            <span aria-hidden className="block h-px w-full bg-gradient-to-r from-transparent via-[#B4E3BD]/40 to-transparent" />
            <div className="max-h-[65vh] overflow-auto [scrollbar-color:#333_transparent] [scrollbar-width:thin]">
              <table className="w-full min-w-[480px] sm:min-w-0">
                <thead>
                  <tr>
                    <th className="sticky top-0 z-10 border-b border-white/10 bg-[#161616] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-[#B4E3BD]/70 sm:px-5 sm:py-4 sm:text-[11px]">
                      #
                    </th>
                    <th className="sticky top-0 z-10 border-b border-white/10 bg-[#161616] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-[#B4E3BD]/70 sm:px-5 sm:py-4 sm:text-[11px]">
                      Name
                    </th>
                    <th className="sticky top-0 z-10 border-b border-white/10 bg-[#161616] px-3 py-2 text-left sm:px-5">
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
                    <th className="sticky top-0 z-10 border-b border-white/10 bg-[#161616] px-3 py-2 text-left sm:px-5">
                      <FilterDropdown
                        label="Event"
                        options={[
                          { value: 0, label: "Total" },
                          { value: 1, label: "Event 1" },
                          { value: 2, label: "Event 2" },
                          ...COMPETITION_EVENT_NUMBERS.filter((n) => n > 2).map((n) => ({
                            value: n,
                            label: eventLabel(n),
                          })),
                        ]}
                        selected={eventFilter}
                        onSelect={(v) => setEventFilter(v as number)}
                      />
                    </th>
                    <th className="sticky top-0 z-10 border-b border-white/10 bg-[#161616] px-3 py-3 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-[#B4E3BD]/70 sm:px-5 sm:py-4 sm:text-[11px]">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-14 text-center sm:px-6">
                        <p className="text-sm font-semibold text-gray-300">No results match your filters.</p>
                        <p className="mt-1 text-xs text-gray-500">Try a different level or event.</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row) => {
                      const podium =
                        row.place === 1
                          ? {
                              badge: "bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/40",
                              row: "bg-[#FFD700]/[0.05] hover:bg-[#FFD700]/[0.09] shadow-[inset_3px_0_0_0_#FFD700]",
                              score: "text-[#FFD700]",
                            }
                          : row.place === 2
                            ? {
                                badge: "bg-[#C0C0C0]/15 text-[#D4D4D4] border-[#C0C0C0]/40",
                                row: "bg-[#C0C0C0]/[0.04] hover:bg-[#C0C0C0]/[0.08] shadow-[inset_3px_0_0_0_#C0C0C0]",
                                score: "text-[#D4D4D4]",
                              }
                            : row.place === 3
                              ? {
                                  badge: "bg-[#CD7F32]/15 text-[#E09A5A] border-[#CD7F32]/40",
                                  row: "bg-[#CD7F32]/[0.05] hover:bg-[#CD7F32]/[0.09] shadow-[inset_3px_0_0_0_#CD7F32]",
                                  score: "text-[#E09A5A]",
                                }
                              : {
                                  badge: "border-transparent text-gray-500",
                                  row: "hover:bg-white/[0.04]",
                                  score: "text-white",
                                };

                      return (
                        <tr key={`${row.name}-${row.event}`} className={`border-b border-white/5 transition-colors duration-200 last:border-0 ${podium.row}`}>
                          <td className="px-3 py-3 sm:px-5 sm:py-4">
                            <span className={`inline-flex min-w-[28px] items-center justify-center rounded-lg border px-2 py-0.5 text-xs font-black tabular-nums sm:min-w-[32px] sm:py-1 sm:text-sm ${podium.badge}`}>
                              {row.place}
                            </span>
                          </td>
                          <td className="px-3 py-3 sm:px-5 sm:py-4">
                            <button
                              type="button"
                              onClick={() => openAthleteDetails(row.name)}
                              title={`View ${row.name}'s results`}
                              className="block max-w-[100px] truncate text-left text-xs font-semibold text-white underline-offset-4 transition hover:text-[#B4E3BD] hover:underline sm:max-w-none sm:text-sm"
                            >
                              {row.name}
                            </button>
                          </td>
                          <td className="px-3 py-3 sm:px-5 sm:py-4"><LevelBadge level={row.level} /></td>
                          <td className="px-3 py-3 sm:px-5 sm:py-4"><EventBadge event={row.event} /></td>
                          <td className={`whitespace-nowrap px-3 py-3 text-right text-sm font-black tabular-nums sm:px-5 sm:py-4 sm:text-base ${podium.score}`}>
                            {row.score !== null ? row.score.toLocaleString() : <span className="text-gray-600">—</span>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Back to top */}
          <div className="mt-12 flex justify-center">
            <BackToTop onClick={() => scrollTo("hero")} />
          </div>
        </div>
      </section>

      <AddAthleteModal
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditingAthlete(null);
        }}
        onSaved={() => {
          loadLeaderboard();
        }}
        editingAthlete={editingAthlete}
      />
      <ShowAthletesModal
        open={showAthletesOpen}
        onClose={closeShowAthletes}
        onDataChanged={() => {
          loadLeaderboard();
        }}
        readOnly={showAthletesReadOnly}
        initialName={showAthletesInitialName}
        hideList={showAthletesReadOnly}
        onEditAthlete={handleEditAthlete}
      />
      <ScheduleManagerModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onDataChanged={() => {
          loadSchedule();
          loadLeaderboard();
        }}
      />
      <RuleBookModal
        open={ruleBookOpen}
        onClose={() => setRuleBookOpen(false)}
        targetDay={ruleBookTargetDay}
      />
    </main>
  );
}
