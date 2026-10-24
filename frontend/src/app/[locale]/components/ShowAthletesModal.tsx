"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
import { useBodyScrollLock } from "./useScrollLock";
import { useLocale } from "next-intl";
import { eventLabel } from "@/lib/competition-events";

type AthleteEntry = {
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
  heat: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onDataChanged: () => void;
  /** When true, the modal is a read-only view — no editing and no delete. */
  readOnly?: boolean;
  /** When set, the modal opens with this athlete's entries already expanded. */
  initialName?: string | null;
  /** When true, only the initial athlete's details are shown (no search / list). */
  hideList?: boolean;
  /** Called when the coach clicks "Edit athlete" with the athlete's current registration. */
  onEditAthlete?: (athlete: {
    name: string;
    level: string;
    events: { event: number; heat: number | null }[];
  }) => void;
};

const EVENT_COLORS: Record<number, { chip: string; dot: string; bg: string }> = {
  1: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
  2: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
  3: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
  4: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
  5: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
  6: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
  7: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
  8: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
  9: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
};

const LEVEL_STYLES: Record<string, { badge: string; bg: string }> = {
  Beginner: { badge: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", bg: "hover:bg-[#B4E3BD]/5" },
  Intermediate: { badge: "bg-[#f97316]/20 text-[#f97316] border-[#f97316]/30", bg: "hover:bg-[#f97316]/5" },
  Advanced: { badge: "bg-[#ec4899]/20 text-[#ec4899] border-[#ec4899]/30", bg: "hover:bg-[#ec4899]/5" },
};

/** Convert total seconds → MM:SS (e.g. 330 → "05:30"). */
function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/** Format a stored tiebreaker value for display (time → MM:SS). */
function formatTiebreaker(type: string | null, value: number | null): string {
  if (value === null) return "—";
  if (type === "time") return formatTime(value);
  return value.toLocaleString();
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconChevronDown({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/* Reusable numeric editor field (score / reps / weight). */
function NumField({
  label,
  value,
  onChange,
  placeholder = "",
  ariaLabel,
  accent = false,
}: {
  label: string;
  value: string;
  onChange: (raw: string) => void;
  placeholder?: string;
  ariaLabel: string;
  accent?: boolean;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`w-full rounded-xl border border-gray-700 bg-gray-900 px-3.5 py-3 text-center text-sm tabular-nums text-white outline-none transition focus:border-[#B4E3BD] focus:ring-1 focus:ring-[#B4E3BD]/20 placeholder:text-gray-600 ${
          accent ? "font-black" : "font-bold"
        }`}
      />
    </div>
  );
}

/* Time (tiebreaker) field — always the MM : SS split input. */
function TimeField({
  label = "Time",
  min,
  sec,
  onMin,
  onSec,
}: {
  label?: string;
  min: string;
  sec: string;
  onMin: (v: string) => void;
  onSec: (v: string) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        {label}
      </span>
      <div className="flex items-center gap-1.5" dir="ltr">
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={min}
          onChange={(e) => onMin(e.target.value.replace(/\D/g, "").slice(0, 2))}
          placeholder="00"
          aria-label="Time minutes"
          className="w-full min-w-0 rounded-xl border border-gray-700 bg-gray-900 px-1 py-3 text-center text-sm font-bold tabular-nums text-white outline-none transition focus:border-[#B4E3BD] focus:ring-1 focus:ring-[#B4E3BD]/20 placeholder:text-gray-600"
        />
        <span className="shrink-0 select-none font-black text-gray-500">:</span>
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={sec}
          onChange={(e) => onSec(e.target.value.replace(/\D/g, "").slice(0, 2))}
          placeholder="00"
          aria-label="Time seconds"
          className="w-full min-w-0 rounded-xl border border-gray-700 bg-gray-900 px-1 py-3 text-center text-sm font-bold tabular-nums text-white outline-none transition focus:border-[#B4E3BD] focus:ring-1 focus:ring-[#B4E3BD]/20 placeholder:text-gray-600"
        />
      </div>
    </div>
  );
}

export default function ShowAthletesModal({
  open,
  onClose,
  onDataChanged,
  readOnly = false,
  initialName = null,
  hideList = false,
  onEditAthlete = undefined,
}: Props) {
  const locale = useLocale();
  const isRTL = locale === "fa";
  useBodyScrollLock(open);

  const [searchQuery, setSearchQuery] = useState("");
  const [athleteNames, setAthleteNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedName, setExpandedName] = useState<string | null>(null);
  const [entries, setEntries] = useState<AthleteEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editScore, setEditScore] = useState<string>("");
  const [editReps, setEditReps] = useState<string>("");
  const [editWeight, setEditWeight] = useState<string>("");
  const [editScore2, setEditScore2] = useState<string>("");
  const [editReps2, setEditReps2] = useState<string>("");
  const [editWeight2, setEditWeight2] = useState<string>("");
  const [editTieMin, setEditTieMin] = useState<string>("");
  const [editTieSec, setEditTieSec] = useState<string>("");
  const [editTieMin2, setEditTieMin2] = useState<string>("");
  const [editTieSec2, setEditTieSec2] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearchQuery("");
    setExpandedName(initialName ?? null);
    setEditingId(null);
  }, [open, initialName]);

  useEffect(() => {
    if (!open || hideList) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const qs = searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : "";
        const names = await api.get<string[]>(`/competition-athletes/names${qs}`);
        if (!cancelled) setAthleteNames(names);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load athletes"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [open, searchQuery]);

  const loadEntries = useCallback(async (name: string) => {
    setEntriesLoading(true);
    try {
      const data = await api.get<{ athletes: AthleteEntry[] }>(`/competition-athletes/${encodeURIComponent(name)}`);
      setEntries(data.athletes);
    } catch { setEntries([]); }
    finally { setEntriesLoading(false); }
  }, []);

  // When opened with an initial athlete (read-only detail view), load their entries.
  useEffect(() => {
    if (open && initialName) {
      loadEntries(initialName);
    }
  }, [open, initialName, loadEntries]);

  function handleToggleExpand(name: string) {
    if (expandedName === name) {
      setExpandedName(null);
      setEditingId(null);
    } else {
      setExpandedName(name);
      setEditingId(null);
      loadEntries(name);
    }
  }

  async function handleDelete(name: string) {
    try {
      await api.delete(`/competition-athletes/${encodeURIComponent(name)}`);
      setAthleteNames((prev) => prev.filter((n) => n !== name));
      if (expandedName === name) setExpandedName(null);
      onDataChanged();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete athlete"));
    }
  }

  function startEditScore(entry: AthleteEntry) {
    setEditingId(entry.id);
    setEditScore(entry.score !== null ? String(entry.score) : "");
    setEditReps(entry.reps !== null ? String(entry.reps) : "");
    setEditWeight(entry.weight !== null ? String(entry.weight) : "");
    // Second part of the combined "Event 1&2".
    setEditScore2(entry.score_2 !== null ? String(entry.score_2) : "");
    setEditReps2(entry.reps_2 !== null ? String(entry.reps_2) : "");
    setEditWeight2(entry.weight_2 !== null ? String(entry.weight_2) : "");
    // Tiebreaker is always time — stored as total seconds, split into MM : SS.
    // Event 1 time (part one) and Event 2 time (part two) are kept separately.
    if (entry.tiebreaker_value !== null) {
      setEditTieMin(String(Math.floor(entry.tiebreaker_value / 60)));
      setEditTieSec(String(entry.tiebreaker_value % 60));
    } else {
      setEditTieMin("");
      setEditTieSec("");
    }
    if (entry.tiebreaker_value_2 !== null) {
      setEditTieMin2(String(Math.floor(entry.tiebreaker_value_2 / 60)));
      setEditTieSec2(String(entry.tiebreaker_value_2 % 60));
    } else {
      setEditTieMin2("");
      setEditTieSec2("");
    }
  }

  async function saveScore(entryId: number) {
    setSaving(true);
    try {
      const score = editScore.trim() ? parseInt(editScore, 10) : null;
      const reps = editReps.trim() ? parseInt(editReps, 10) : null;
      const weight = editWeight.trim() ? parseInt(editWeight, 10) : null;
      // Second part of the combined "Event 1&2".
      const score2 = editScore2.trim() ? parseInt(editScore2, 10) : null;
      const reps2 = editReps2.trim() ? parseInt(editReps2, 10) : null;
      const weight2 = editWeight2.trim() ? parseInt(editWeight2, 10) : null;

      // Tiebreaker is always time — stored as total seconds (MM:SS → seconds).
      // Event 1 and Event 2 keep separate times.
      let tiebreakerValue: number | null = null;
      if (editTieMin.trim() || editTieSec.trim()) {
        const mins = parseInt(editTieMin || "0", 10);
        const secs = parseInt(editTieSec || "0", 10);
        if (Number.isNaN(mins) || Number.isNaN(secs) || secs > 59 || mins < 0) {
          setError("Invalid time — use MM:SS (e.g. 05:30).");
          return;
        }
        tiebreakerValue = mins * 60 + secs;
      }
      let tiebreakerValue2: number | null = null;
      if (editTieMin2.trim() || editTieSec2.trim()) {
        const mins2 = parseInt(editTieMin2 || "0", 10);
        const secs2 = parseInt(editTieSec2 || "0", 10);
        if (Number.isNaN(mins2) || Number.isNaN(secs2) || secs2 > 59 || mins2 < 0) {
          setError("Invalid time — use MM:SS (e.g. 05:30).");
          return;
        }
        tiebreakerValue2 = mins2 * 60 + secs2;
      }

      await api.patch(`/competition-athletes/${entryId}`, {
        score,
        reps,
        weight,
        score_2: score2,
        reps_2: reps2,
        weight_2: weight2,
        tiebreaker_type: "time",
        tiebreaker_value: tiebreakerValue,
        tiebreaker_value_2: tiebreakerValue2,
      });
      setEntries((prev) => prev.map((e) =>
        e.id === entryId
          ? { ...e, score, reps, weight, score_2: score2, reps_2: reps2, weight_2: weight2, tiebreaker_type: "time", tiebreaker_value: tiebreakerValue, tiebreaker_value_2: tiebreakerValue2 }
          : e
      ));
      setEditingId(null);
      onDataChanged();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save score"));
    } finally { setSaving(false); }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div dir="ltr" className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-b from-[#0d0d0d] to-[#111111] shadow-2xl shadow-black/60">
        <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-[#B4E3BD]/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${readOnly ? "bg-[#B4E3BD]/10 text-[#B4E3BD]" : "bg-amber-500/10 text-amber-400"}`}>
              {readOnly ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{readOnly ? "Athlete details" : "Athletes"}</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {readOnly ? "View scores & tiebreakers — read only" : "Manage competition athletes, scores & events"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-800 hover:text-white">
            <IconX />
          </button>
        </div>
        {/* Search bar */}
        {!hideList && (
        <div className="px-6 pb-3">
          <div className="relative">
            <span className={`absolute inset-y-0 flex items-center ${isRTL ? "right-3" : "left-3"} text-gray-500 pointer-events-none`}>
              <IconSearch />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search athletes by name..."
              className={`w-full rounded-xl border border-gray-800 bg-[#141414] px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD] focus:bg-gray-900 focus:ring-1 focus:ring-[#B4E3BD]/20 ${isRTL ? "pr-10" : "pl-10"}`}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")}
                className={`absolute inset-y-0 flex items-center ${isRTL ? "left-3" : "right-3"} text-gray-500/50 transition hover:text-gray-300`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" /></svg>
              </button>
            )}
          </div>
        </div>
        )}
        {/* Athlete list */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 coach-scroll">
          {!hideList && loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <svg width="18" height="18" className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeDashoffset="6" strokeLinecap="round"/></svg>
                Loading athletes...
              </div>
            </div>
          )}

          {!hideList && !loading && error && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {!hideList && !loading && !error && athleteNames.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 text-gray-700">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              </svg>
              <p className="text-sm">{searchQuery.trim() ? "No athletes match your search." : "No athletes registered yet."}</p>
            </div>
          )}

          {(() => {
            const visibleNames = hideList && initialName ? [initialName] : athleteNames;
            return visibleNames.length > 0 ? (
              <div className="space-y-2">
                {visibleNames.map((name) => {
                const isExpanded = expandedName === name;
                return (
                  <div key={name} className="rounded-2xl border border-gray-800 bg-[#141414]/60 overflow-hidden transition-all duration-200">
                    {/* Collapsed row */}
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(name)}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B4E3BD]/10 text-sm font-bold text-[#B4E3BD]">
                          {name.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="truncate text-sm font-semibold text-white">{name}</span>
                      </div>
                      <IconChevronDown open={isExpanded} />
                    </button>
                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-gray-800/60 px-4 py-4 space-y-3">
                        {entriesLoading ? (
                          <p className="text-center text-sm text-gray-500 py-4">Loading entries...</p>
                        ) : entries.length === 0 ? (
                          <p className="text-center text-sm text-gray-500 py-4">No entries found.</p>
                        ) : (
                          entries.map((entry) => {
                            const ec = EVENT_COLORS[entry.event];
                            const ls = LEVEL_STYLES[entry.level] || LEVEL_STYLES["Beginner"];
                            const isEditing = editingId === entry.id;

                            const summaryContent = (
                              <>
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${ec.chip}`}>
                                    <span className={`h-2 w-2 rounded-full ${ec.dot}`} />
                                    {eventLabel(entry.event)}
                                  </span>
                                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ls.badge}`}>
                                    {entry.level}
                                  </span>
                                  {entry.heat ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-300">
                                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
                                      Heat {entry.heat}
                                    </span>
                                  ) : null}
                                </div>

                                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                                  <div className="flex min-w-0 flex-col items-start gap-1 sm:items-end">
                                    {/* Per-event metrics: Reps · Weight · Time (+ Event 2 part for the combined event) */}
                                    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] font-medium text-gray-500">
                                      {entry.event === 1 ? (
                                        <>
                                          <span>Ev1 Reps <b className="font-bold text-gray-400">{entry.reps ?? "—"}</b> · Wt <b className="font-bold text-gray-400">{entry.weight !== null ? `${entry.weight} kg` : "—"}</b></span>
                                          <span className="text-gray-700">•</span>
                                          <span>Ev2 Reps <b className="font-bold text-gray-400">{entry.reps_2 ?? "—"}</b> · Wt <b className="font-bold text-gray-400">{entry.weight_2 !== null ? `${entry.weight_2} kg` : "—"}</b></span>
                                          <span className="text-gray-700">•</span>
                                        </>
                                      ) : (
                                        <>
                                          <span>Reps <b className="font-bold text-gray-400">{entry.reps ?? "—"}</b></span>
                                          <span className="text-gray-700">•</span>
                                          <span>Wt <b className="font-bold text-gray-400">{entry.weight !== null ? `${entry.weight} kg` : "—"}</b></span>
                                          <span className="text-gray-700">•</span>
                                        </>
                                      )}
                                      <span>
                                      {entry.event === 1 ? (
                                        <>
                                          Ev1 Time <b className="font-bold text-gray-400 tabular-nums">{formatTiebreaker(entry.tiebreaker_type, entry.tiebreaker_value)}</b>
                                          <span className="text-gray-700"> • </span>
                                          Ev2 Time <b className="font-bold text-gray-400 tabular-nums">{formatTiebreaker(entry.tiebreaker_type, entry.tiebreaker_value_2)}</b>
                                        </>
                                      ) : (
                                        <>Time <b className="font-bold text-gray-400 tabular-nums">{formatTiebreaker(entry.tiebreaker_type, entry.tiebreaker_value)}</b></>
                                      )}
                                    </span>
                                    </span>
                                    {entry.event === 1 ? (
                                      <span className="flex flex-wrap items-center gap-1.5">
                                        <span className="inline-flex items-baseline gap-1.5 rounded-lg border border-[#B4E3BD]/25 bg-[#B4E3BD]/10 px-2 py-1">
                                          <span className="text-[8px] font-bold uppercase tracking-wider text-[#B4E3BD]/80">Event 1</span>
                                          <span className="text-sm sm:text-base font-black tabular-nums leading-none text-white">
                                            {entry.score !== null ? entry.score.toLocaleString() : <span className="font-medium text-gray-500">—</span>}
                                          </span>
                                        </span>
                                        <span className="inline-flex items-baseline gap-1.5 rounded-lg border border-[#B4E3BD]/25 bg-[#B4E3BD]/10 px-2 py-1">
                                          <span className="text-[8px] font-bold uppercase tracking-wider text-[#B4E3BD]/80">Event 2</span>
                                          <span className="text-sm sm:text-base font-black tabular-nums leading-none text-white">
                                            {entry.score_2 !== null ? entry.score_2.toLocaleString() : <span className="font-medium text-gray-500">—</span>}
                                          </span>
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-base sm:text-lg font-black tabular-nums text-white">
                                        {entry.score !== null ? (
                                          entry.score.toLocaleString()
                                        ) : (
                                          <span className="text-sm font-medium text-gray-500">{readOnly ? "—" : "Add Score"}</span>
                                        )}
                                      </span>
                                    )}
                                  </div>

                                  {!readOnly && (
                                    <span
                                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                                        isEditing
                                          ? "border-[#B4E3BD]/30 bg-[#B4E3BD]/10 text-[#B4E3BD]"
                                          : "border-gray-800 bg-gray-900/60 text-gray-500 group-hover:border-[#B4E3BD]/40 group-hover:text-[#B4E3BD]"
                                      }`}
                                    >
                                      {isEditing ? (
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                                      ) : (
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                      )}
                                    </span>
                                  )}
                                </div>
                              </>
                            );

                            return (
                              <div
                                key={entry.id}
                                className={`overflow-hidden rounded-xl border transition-colors duration-200 ${
                                  isEditing ? "border-[#B4E3BD]/30 bg-[#B4E3BD]/5" : "border-gray-800/70"
                                }`}
                              >
                                {/* Summary row - tap anywhere to edit the score & tiebreaker */}
                                {readOnly ? (
                                  <div className="flex w-full flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                    {summaryContent}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => (isEditing ? setEditingId(null) : startEditScore(entry))}
                                    className={`group flex w-full flex-col gap-2.5 px-4 py-3 text-left transition sm:flex-row sm:items-center sm:justify-between ${ec.bg}`}
                                  >
                                    {summaryContent}
                                  </button>
                                )}

                                {/* Editor panel - expands below the summary so the row never collapses */}
                                {isEditing && (
                                  <div className="editor-panel-in border-t border-[#B4E3BD]/15 bg-black/40 px-4 py-4 sm:px-5">
                                    {entry.event === 1 ? (
                                                                          <>
                                                                            {/* Event 1 - first part */}
                                                                            <div>
                                                                              <span className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#B4E3BD]">
                                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                                                Event 1 <span className="font-medium normal-case text-gray-500">- first part</span>
                                                                              </span>
                                                                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:items-end">
                                                                                <NumField label="Reps" value={editReps} onChange={setEditReps} placeholder="Reps" ariaLabel="Reps (Event 1)" />
                                                                                <NumField label="Weight" value={editWeight} onChange={setEditWeight} placeholder="kg" ariaLabel="Weight (Event 1)" />
                                                                                <NumField label="Score" value={editScore} onChange={setEditScore} placeholder="0" ariaLabel="Score (Event 1)" accent />
                                                                              </div>
                                                                            </div>

                                                                            {/* Event 2 - second part */}
                                                                            <div className="mt-4 border-t border-gray-800 pt-4">
                                                                              <span className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#B4E3BD]">
                                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                                                Event 2 <span className="font-medium normal-case text-gray-500">- second part</span>
                                                                              </span>
                                                                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:items-end">
                                                                                <NumField label="Reps" value={editReps2} onChange={setEditReps2} placeholder="Reps" ariaLabel="Reps (Event 2)" />
                                                                                <NumField label="Weight" value={editWeight2} onChange={setEditWeight2} placeholder="kg" ariaLabel="Weight (Event 2)" />
                                                                                <NumField label="Score" value={editScore2} onChange={setEditScore2} placeholder="0" ariaLabel="Score (Event 2)" accent />
                                                                              </div>
                                                                            </div>

                                                                            {/* Time - separate for each part */}
                                                                            <div className="mt-4 border-t border-gray-800 pt-4">
                                                                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
                                                                                <TimeField label="Event 1 · Time" min={editTieMin} sec={editTieSec} onMin={setEditTieMin} onSec={setEditTieSec} />
                                                                                <TimeField label="Event 2 · Time" min={editTieMin2} sec={editTieSec2} onMin={setEditTieMin2} onSec={setEditTieSec2} />
                                                                              </div>
                                                                            </div>
                                                                          </>
                                                                        ) : (
                                                                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end">
                                                                            <NumField label="Reps" value={editReps} onChange={setEditReps} placeholder="Reps" ariaLabel="Reps" />
                                                                            <NumField label="Weight" value={editWeight} onChange={setEditWeight} placeholder="kg" ariaLabel="Weight" />
                                                                            <TimeField min={editTieMin} sec={editTieSec} onMin={setEditTieMin} onSec={setEditTieSec} />
                                                                            <NumField label="Score" value={editScore} onChange={setEditScore} placeholder="0" ariaLabel="Score" accent />
                                                                          </div>
                                                                        )}
                                    <div className="mt-4 flex items-center justify-end gap-2.5">
                                      <button
                                        type="button"
                                        onClick={() => setEditingId(null)}
                                        disabled={saving}
                                        className="rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-400 transition hover:border-gray-500 hover:text-gray-200 disabled:opacity-50"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => saveScore(entry.id)}
                                        disabled={saving}
                                        className="inline-flex min-w-[86px] items-center justify-center gap-1.5 rounded-xl bg-[#B4E3BD] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {saving ? (
                                          <>
                                            <svg width="14" height="14" className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9" strokeDasharray="28.3 28.3" strokeDashoffset="8" strokeLinecap="round"/></svg>
                                            Saving...
                                          </>
                                        ) : (
                                          <>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                            Save
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );

                          })
                        )}
                        {/* Edit / Delete buttons */}
                        {!readOnly && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                onEditAthlete?.({
                                  name,
                                  level: entries[0]?.level ?? name,
                                  events: entries.map((e) => ({ event: e.event, heat: e.heat })),
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#B4E3BD]/40 px-3 py-1.5 text-xs font-semibold text-[#B4E3BD] transition hover:bg-[#B4E3BD]/10"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              Edit athlete
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Remove "${name}" from all events?`)) handleDelete(name);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/30 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-950/30 hover:border-red-500/50"
                            >
                              <IconTrash />
                              Remove athlete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            ) : null;
          })()}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-800 px-6 py-4">
          <button type="button" onClick={onClose}
            className="rounded-full border border-gray-800 px-5 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-600"
          >Close</button>
        </div>
      </div>
    </div>
  );
}
