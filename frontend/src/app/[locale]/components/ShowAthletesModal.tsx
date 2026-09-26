"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
import { useBodyScrollLock } from "./useScrollLock";
import { useLocale } from "next-intl";

type AthleteEntry = {
  id: number;
  name: string;
  level: string;
  event: number;
  score: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onDataChanged: () => void;
};

const EVENT_COLORS: Record<number, { chip: string; dot: string; bg: string }> = {
  1: { chip: "bg-rose-500/20 text-rose-300 border-rose-500/30", dot: "bg-rose-400", bg: "hover:bg-rose-500/5" },
  2: { chip: "bg-amber-500/20 text-amber-300 border-amber-500/30", dot: "bg-amber-400", bg: "hover:bg-amber-500/5" },
  3: { chip: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400", bg: "hover:bg-emerald-500/5" },
  4: { chip: "bg-violet-500/20 text-violet-300 border-violet-500/30", dot: "bg-violet-400", bg: "hover:bg-violet-500/5" },
};

const LEVEL_STYLES: Record<string, { badge: string; bg: string }> = {
  Beginner: { badge: "bg-[#B4E3BD]/15 text-[#B4E3BD] border-[#B4E3BD]/30", bg: "hover:bg-[#B4E3BD]/5" },
  Intermediate: { badge: "bg-orange-500/15 text-orange-300 border-orange-500/30", bg: "hover:bg-orange-500/5" },
  Advanced: { badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30", bg: "hover:bg-cyan-500/5" },
};

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

export default function ShowAthletesModal({ open, onClose, onDataChanged }: Props) {
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearchQuery("");
    setExpandedName(null);
    setEditingId(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
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
  }

  async function saveScore(entryId: number) {
    setSaving(true);
    try {
      const score = editScore.trim() ? parseInt(editScore, 10) : null;
      await api.patch(`/competition-athletes/${entryId}`, { score });
      setEntries((prev) => prev.map((e) => e.id === entryId ? { ...e, score } : e));
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
      <div className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-b from-[#0d0d0d] to-[#111111] shadow-2xl shadow-black/60">
        <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-[#B4E3BD]/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Athletes</h2>
              <p className="mt-0.5 text-xs text-gray-500">Manage competition athletes, scores & events</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-800 hover:text-white">
            <IconX />
          </button>
        </div>
        {/* Search bar */}
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
        {/* Athlete list */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 coach-scroll">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <svg width="18" height="18" className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeDashoffset="6" strokeLinecap="round"/></svg>
                Loading athletes...
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {!loading && !error && athleteNames.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 text-gray-700">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              </svg>
              <p className="text-sm">{searchQuery.trim() ? "No athletes match your search." : "No athletes registered yet."}</p>
            </div>
          )}

          {!loading && !error && athleteNames.length > 0 && (
            <div className="space-y-2">
              {athleteNames.map((name) => {
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

                            return (
                              <div key={entry.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-800/70 px-4 py-3 sm:py-3 transition ${ec.bg}`}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${ec.chip}`}>
                                    <span className={`h-2 w-2 rounded-full ${ec.dot}`} />
                                    Event {entry.event}
                                  </span>
                                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ls.badge}`}>
                                    {entry.level}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                  {isEditing ? (
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                      <input
                                        type="number"
                                        inputMode="numeric"
                                        value={editScore}
                                        onChange={(e) => setEditScore(e.target.value)}
                                        placeholder="Score"
                                        autoFocus
                                        className="flex-1 sm:w-24 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 sm:py-1.5 text-center text-base sm:text-sm font-bold text-white outline-none transition focus:border-[#B4E3BD] focus:ring-1 focus:ring-[#B4E3BD]/20"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => saveScore(entry.id)}
                                        disabled={saving}
                                        className="rounded-lg bg-[#B4E3BD] px-4 py-2.5 sm:py-1.5 text-sm font-bold text-black transition hover:bg-white disabled:opacity-50 min-w-[60px]"
                                      >
                                        {saving ? "..." : "Save"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingId(null)}
                                        className="rounded-lg border border-gray-700 px-3 py-2.5 sm:py-1.5 text-gray-400 transition hover:border-gray-500"
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => startEditScore(entry)}
                                      className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-gray-700/50 px-4 py-2.5 sm:py-1.5 text-sm font-bold tabular-nums text-gray-300 transition hover:border-[#B4E3BD]/50 hover:text-[#B4E3BD] active:scale-[0.98]"
                                    >
                                      {entry.score !== null ? (
                                        <span>{entry.score.toLocaleString()}</span>
                                      ) : (
                                        <span className="text-gray-600 text-sm font-normal">Add Score</span>
                                      )}
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                        {/* Delete button */}
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
                );
              })}
            </div>
          )}
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
