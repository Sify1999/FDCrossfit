"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
import { dayDateLabel } from "@/lib/competition-days";
import { useBodyScrollLock } from "./useScrollLock";

type HeatItem = {
  id: number;
  event_id: number;
  heat_number: number;
  start_time: string;
  end_time: string;
  athletes: string[];
};

type EventItem = {
  id: number;
  level: string;
  event_number: number;
  name: string;
  day: number | null;
  date: string | null;
  heats: HeatItem[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onDataChanged: () => void;
};

const LEVELS = [
  { key: "beginner", label: "Beginner" },
  { key: "intermediate", label: "Intermediate" },
  { key: "advanced", label: "Advanced" },
] as const;

const LEVEL_STYLES: Record<string, { active: string; idle: string }> = {
  beginner: { active: "border-[#B4E3BD]/60 bg-[#B4E3BD]/15 text-[#B4E3BD]", idle: "border-gray-800 text-gray-400 hover:text-gray-200" },
  intermediate: { active: "border-[#f97316]/60 bg-[#f97316]/15 text-[#f97316]", idle: "border-gray-800 text-gray-400 hover:text-gray-200" },
  advanced: { active: "border-[#ec4899]/60 bg-[#ec4899]/15 text-[#ec4899]", idle: "border-gray-800 text-gray-400 hover:text-gray-200" },
};

function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconSchedule() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconFlame() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

export default function ScheduleManagerModal({ open, onClose, onDataChanged }: Props) {
  useBodyScrollLock(open);

  const [level, setLevel] = useState<(typeof LEVELS)[number]["key"]>("beginner");
  const [byLevel, setByLevel] = useState<Record<string, EventItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-event "add heat" drafts
  const [heatDrafts, setHeatDrafts] = useState<Record<number, { heat_number: string; start_time: string; end_time: string }>>({});

  // Popover day picker (mirrors the heat picker UI in the Add Athlete modal)
  const [openDayMenu, setOpenDayMenu] = useState<number | null>(null);
  const [dayMenuPos, setDayMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const dayBtnRef = useRef<HTMLButtonElement | null>(null);
  const dayMenuRef = useRef<HTMLDivElement | null>(null);

  const events = byLevel[level] ?? [];

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ events: EventItem[] }>("/competition/schedule");
      const grouped: Record<string, EventItem[]> = {};
      for (const e of res.events) {
        (grouped[e.level] ??= []).push(e);
      }
      for (const key of Object.keys(grouped)) {
        grouped[key].sort((a, b) => a.event_number - b.event_number);
      }
      setByLevel(grouped);
      setError(null);
    } catch (err) {
      setByLevel({});
      setError(getErrorMessage(err, "Failed to load the schedule."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadAll();
  }, [open, loadAll]);

  // Close the day menu when clicking anywhere outside the trigger/menu.
  // (Must live above the `if (!open) return null;` early return so the hook
  // count stays identical on every render.)
  useEffect(() => {
    if (openDayMenu === null) return;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (
        (dayBtnRef.current && dayBtnRef.current.contains(t)) ||
        (dayMenuRef.current && dayMenuRef.current.contains(t))
      ) {
        return;
      }
      closeDayMenu();
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [openDayMenu]);

  if (!open) return null;

  async function run(request: Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await request;
      await loadAll();
      onDataChanged();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update the schedule. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  function updateEventLocal(evId: number, patch: Partial<EventItem>) {
    setByLevel((prev) => ({
      ...prev,
      [level]: (prev[level] ?? []).map((e) => (e.id === evId ? { ...e, ...patch } : e)),
    }));
  }

  function saveEventDay(ev: EventItem, day: number | null) {
    updateEventLocal(ev.id, { day });
    run(api.patch(`/competition/events/${ev.id}`, { day }));
  }

  function closeDayMenu() {
    setOpenDayMenu(null);
    setDayMenuPos(null);
  }

  function toggleDayMenu(evId: number, btn: HTMLButtonElement) {
    if (openDayMenu === evId) {
      closeDayMenu();
      return;
    }
    const rect = btn.getBoundingClientRect();
    setDayMenuPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    setOpenDayMenu(evId);
  }

  function pickDay(ev: EventItem, day: number | null) {
    closeDayMenu();
    saveEventDay(ev, day);
  }

  function addHeat(ev: EventItem) {
    const draft = heatDrafts[ev.id];
    if (!draft) return;
    const n = parseInt(draft.heat_number, 10);
    if (Number.isNaN(n) || n < 1) {
      setError("Heat number must be at least 1.");
      return;
    }
    if (!draft.start_time || !draft.end_time) {
      setError("Start and end times are required.");
      return;
    }
    run(
      api.post("/competition/heats", {
        event_id: ev.id,
        heat_number: n,
        start_time: draft.start_time,
        end_time: draft.end_time,
      })
    );
    setHeatDrafts((prev) => ({ ...prev, [ev.id]: { heat_number: "", start_time: "", end_time: "" } }));
  }

  function saveHeat(h: HeatItem) {
    run(
      api.patch(`/competition/heats/${h.id}`, {
        heat_number: h.heat_number,
        start_time: h.start_time,
        end_time: h.end_time,
      })
    );
  }

  function deleteHeat(h: HeatItem) {
    run(api.delete(`/competition/heats/${h.id}`));
  }

  function updateHeatLocal(evId: number, heatId: number, patch: Partial<HeatItem>) {
    setByLevel((prev) => ({
      ...prev,
      [level]: (prev[level] ?? []).map((e) =>
        e.id === evId
          ? { ...e, heats: e.heats.map((h) => (h.id === heatId ? { ...h, ...patch } : h)) }
          : e
      ),
    }));
  }

  function updateDraft(evId: number, patch: Partial<{ heat_number: string; start_time: string; end_time: string }>) {
    setHeatDrafts((prev) => {
      const current = prev[evId] ?? { heat_number: "", start_time: "", end_time: "" };
      return { ...prev, [evId]: { ...current, ...patch } };
    });
  }

  const inputCls = "rounded-lg border border-gray-700 bg-gray-900 px-2.5 py-2 text-xs text-white outline-none transition focus:border-[#B4E3BD] placeholder:text-gray-600";
  const timeCls = `${inputCls} w-28 px-2 [color-scheme:dark]`;

  return (
<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div dir="ltr" className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-b from-[#0d0d0d] to-[#111111] shadow-2xl shadow-black/60">
        <span className="h-1 shrink-0 bg-gradient-to-r from-transparent via-[#B4E3BD] to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
              <IconSchedule />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Competition schedule</h2>
              <p className="mt-0.5 text-xs text-gray-500">Events, heats & their times — stored dynamically</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-800 hover:text-white">
            <IconX />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-6 coach-scroll">
          {/* Level tabs */}
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((lvl) => {
              const st = LEVEL_STYLES[lvl.key];
              const isActive = level === lvl.key;
              return (
                <button
                  key={lvl.key}
                  type="button"
                  onClick={() => {
                    closeDayMenu();
                    setLevel(lvl.key);
                  }}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                    isActive ? `${st.active} shadow-sm` : `${st.idle} hover:border-gray-600`
                  }`}
                >
                  {lvl.label}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-2.5 text-sm text-red-400">{error}</div>
          )}

          {loading ? (
            <p className="py-10 text-center text-sm text-gray-500">Loading schedule…</p>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-800 py-10 text-center">
              <p className="text-sm font-semibold text-gray-400">No events scheduled yet</p>
              <p className="mt-1 text-xs text-gray-600">Add an event below and give it heats with times.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="rounded-2xl border border-gray-800 bg-[#141414]/70 p-3">
                  {/* Event row — pre-built name + day (1–4) selector */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#B4E3BD]/15 px-2.5 text-xs font-black text-[#B4E3BD]">
                      {ev.event_number === 1 ? "1&2" : ev.event_number}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                      {ev.name}
                    </span>

                    {/* Day picker — which competition day (1–4) this event runs on */}
                    <div className="relative min-w-[7.75rem] shrink-0">
                      <button
                        type="button"
                        ref={openDayMenu === ev.id ? dayBtnRef : null}
                        onClick={(e) => toggleDayMenu(ev.id, e.currentTarget)}
                        disabled={busy}
                        aria-haspopup="listbox"
                        aria-expanded={openDayMenu === ev.id}
                        aria-label={`Day for ${ev.name}`}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-white outline-none transition focus:border-[#B4E3BD] disabled:opacity-50 ${
                          openDayMenu === ev.id
                            ? "border-[#B4E3BD] bg-gray-900"
                            : "border-gray-700 bg-gray-900 hover:border-gray-500"
                        }`}
                      >
                        <span className="truncate">
                          {ev.day ? `Day ${ev.day} · ${dayDateLabel(ev.day)}` : "Day —"}
                        </span>
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`shrink-0 text-gray-500 transition-transform duration-200 ${openDayMenu === ev.id ? "rotate-180" : ""}`}
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>

                      {openDayMenu === ev.id && dayMenuPos && (
                        <div
                          ref={dayMenuRef}
                          role="listbox"
                          style={{
                            position: "fixed",
                            top: dayMenuPos.top,
                            left: dayMenuPos.left,
                            minWidth: dayMenuPos.width,
                            zIndex: 9999,
                          }}
                          className="rounded-lg border border-gray-700 bg-[#111] py-1 shadow-xl shadow-black/60"
                        >
                          <button
                            type="button"
                            role="option"
                            aria-selected={!ev.day}
                            onClick={() => pickDay(ev, null)}
                            className={`flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs font-medium transition ${
                              !ev.day
                                ? "bg-[#B4E3BD]/10 text-[#B4E3BD]"
                                : "text-gray-300 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            {!ev.day && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                            <span className={!ev.day ? "" : "pl-4"}>No day</span>
                          </button>
                          {[1, 2, 3, 4].map((d) => {
                            const isSel = ev.day === d;
                            return (
                              <button
                                key={d}
                                type="button"
                                role="option"
                                aria-selected={isSel}
                                onClick={() => pickDay(ev, d)}
                                className={`flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-xs transition ${
                                  isSel
                                    ? "bg-[#B4E3BD]/10 text-[#B4E3BD]"
                                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  {isSel && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                                  )}
                                  <span className={`truncate ${isSel ? "" : "pl-4"}`}>
                                    Day {d}
                                  </span>
                                </span>
                                <span className="shrink-0 text-[10px] text-gray-500">
                                  {dayDateLabel(d)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <span className="shrink-0 rounded-full border border-gray-700 px-2 py-0.5 text-[10px] font-semibold text-gray-400">
                      {ev.heats.length} heat{ev.heats.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {/* Heats */}
                  <div className="mt-3 space-y-2">
{ev.heats.map((h) => (
                      <div key={h.id} className="rounded-xl border border-gray-800/70 bg-gray-900/40 p-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#B4E3BD]/20 bg-[#B4E3BD]/10 px-2 py-1 text-[10px] font-bold text-[#B4E3BD]">
                            <IconFlame /> Heat {h.heat_number}
                          </span>
                          <input type="time" value={h.start_time} onChange={(e) => updateHeatLocal(ev.id, h.id, { start_time: e.target.value })} aria-label="Start time" className={timeCls} />
                          <span className="text-gray-600">→</span>
                          <input type="time" value={h.end_time} onChange={(e) => updateHeatLocal(ev.id, h.id, { end_time: e.target.value })} aria-label="End time" className={timeCls} />
                          <span className="ml-auto flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => saveHeat(h)}
                              disabled={busy}
                              title="Save heat"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-700 text-gray-300 transition hover:border-[#B4E3BD]/60 hover:text-[#B4E3BD] disabled:opacity-50"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteHeat(h)}
                              disabled={busy}
                              title="Delete heat"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-700 text-gray-500 transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                            </button>
                          </span>
                        </div>
                        {h.athletes && h.athletes.length > 0 ? (
                          <p className="mt-1.5 text-[10px] font-medium text-[#B4E3BD]/70">
                            {h.athletes.length} athlete{h.athletes.length === 1 ? "" : "s"}
                          </p>
                        ) : null}
                      </div>
                    ))}

                    {/* Add heat row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={heatDrafts[ev.id]?.heat_number ?? ""}
                        onChange={(e) => updateDraft(ev.id, { heat_number: e.target.value })}
                        placeholder="Heat #"
                        aria-label="New heat number"
                        className="w-20 rounded-lg border border-dashed border-gray-700 bg-transparent px-2 py-1.5 text-xs text-white outline-none transition placeholder:text-gray-600 focus:border-[#B4E3BD]"
                      />
                      <input
                        type="time"
                        value={heatDrafts[ev.id]?.start_time ?? ""}
                        onChange={(e) => updateDraft(ev.id, { start_time: e.target.value })}
                        aria-label="New heat start"
                        className="w-28 rounded-lg border border-dashed border-gray-700 bg-transparent px-2 py-1.5 text-xs text-white outline-none transition focus:border-[#B4E3BD] [color-scheme:dark]"
                      />
                      <span className="text-gray-600">→</span>
                      <input
                        type="time"
                        value={heatDrafts[ev.id]?.end_time ?? ""}
                        onChange={(e) => updateDraft(ev.id, { end_time: e.target.value })}
                        aria-label="New heat end"
                        className="w-28 rounded-lg border border-dashed border-gray-700 bg-transparent px-2 py-1.5 text-xs text-white outline-none transition focus:border-[#B4E3BD] [color-scheme:dark]"
                      />
                      <button
                        type="button"
                        onClick={() => addHeat(ev)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-[#B4E3BD]/40 px-2.5 py-1.5 text-xs font-semibold text-[#B4E3BD] transition hover:bg-[#B4E3BD]/10 disabled:opacity-50"
                      >
                        + Add heat
                      </button>
                    </div>
</div>
                </div>
              ))}
            </div>
          )}

          {/* Pre-built events note */}
          <div className="rounded-2xl border border-dashed border-gray-800 bg-[#141414]/40 px-4 py-3 text-center">
            <p className="text-[11px] leading-4 text-gray-500">
              Events are pre-built (Event 1&2, Event 3 … Event 9). Just add the
              heats &amp; their times for each event.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-800 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-full border border-gray-800 px-5 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-600">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}