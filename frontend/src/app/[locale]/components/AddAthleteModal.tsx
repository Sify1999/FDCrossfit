"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
import { useBodyScrollLock } from "./useScrollLock";
import { eventLabel } from "@/lib/competition-events";

function IconX({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** When set, the modal edits this athlete's registration (events/heats) instead of adding a new one. */
  editingAthlete?: {
    name: string;
    level: string;
    events: { event: number; heat: number | null; line: number | null }[];
  } | null;
};

type ScheduleHeatItem = {
  id: number;
  heat_number: number;
  start_time: string;
  end_time: string;
  athletes: { name: string; line: number | null }[];
};

type ScheduleEventItem = {
  id: number;
  level: string;
  event_number: number;
  name: string;
  day: number | null;
  date: string | null;
  heats: ScheduleHeatItem[];
};

const LEVELS = ["Advanced", "Intermediate", "Beginner"] as const;
const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A5B4D0]";

/** "08:25" → "8:25 AM" — used to show the heat time in the summary. */
function fmtTime(value: string | undefined): string {
  if (!value) return "";
  const [hhRaw, mmRaw] = value.split(":");
  const hh = parseInt(hhRaw, 10);
  const mm = mmRaw ?? "00";
  const period = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 || 12;
  return `${h12}:${mm} ${period}`;
}

export default function AddAthleteModal({
  open,
  onClose,
  onSaved,
  editingAthlete = null,
}: Props) {
  useBodyScrollLock(open);

  const [name, setName] = useState("");
  const [level, setLevel] = useState<string>("Beginner");
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [heatSel, setHeatSel] = useState<Record<number, number | "">>({});
  // Optional line (lane) number per event — rendered next to the heat picker.
  const [lineSel, setLineSel] = useState<Record<number, string>>({});
  const [openHeatMenu, setOpenHeatMenu] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const heatBtnRef = useRef<HTMLButtonElement | null>(null);
  const heatMenuRef = useRef<HTMLDivElement | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEventItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const res = await api.get<{ events: ScheduleEventItem[] }>(
        "/competition/schedule"
      );
      setScheduleEvents(
        res.events
          .filter((e) => e.level === level.toLowerCase())
          .sort((a, b) => a.event_number - b.event_number)
      );
    } catch {
      setScheduleEvents([]);
    } finally {
      setScheduleLoading(false);
    }
  }, [level]);

  useEffect(() => {
    if (open) loadSchedule();
  }, [open, loadSchedule]);

  // Pre-fill the form when editing an athlete's registration.
  useEffect(() => {
    if (!open) return;
    if (editingAthlete) {
      setName(editingAthlete.name);
      setLevel(editingAthlete.level);
      setSelectedEvents(
        editingAthlete.events.map((e) => e.event).sort((a, b) => a - b)
      );
      const sel: Record<number, number | ""> = {};
      const lines: Record<number, string> = {};
      for (const e of editingAthlete.events) {
        sel[e.event] = e.heat ?? "";
        lines[e.event] = e.line?.toString() ?? "";
      }
      setHeatSel(sel);
      setLineSel(lines);
    } else {
      setName("");
      setLevel("Beginner");
      setSelectedEvents([]);
      setHeatSel({});
      setLineSel({});
    }
    setOpenHeatMenu(null);
    setMenuPos(null);
    setError(null);
  }, [open, editingAthlete]);

  function closeHeatMenu() {
    setOpenHeatMenu(null);
    setMenuPos(null);
  }

  function toggleHeatMenu(evNum: number, btn: HTMLButtonElement) {
    if (openHeatMenu === evNum) {
      closeHeatMenu();
      return;
    }
    const rect = btn.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    setOpenHeatMenu(evNum);
  }

  // Close the heat menu when clicking anywhere outside the trigger/menu.
  useEffect(() => {
    if (openHeatMenu === null) return;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (
        (heatBtnRef.current && heatBtnRef.current.contains(t)) ||
        (heatMenuRef.current && heatMenuRef.current.contains(t))
      ) {
        return;
      }
      setOpenHeatMenu(null);
      setMenuPos(null);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [openHeatMenu]);

  if (!open) return null;

  function handleLevelChange(next: string) {
    setLevel(next);
    setSelectedEvents([]);
    setHeatSel({});
    setLineSel({});
    closeHeatMenu();
    setError(null);
  }

  function toggleEvent(evNum: number) {
    const isSelected = selectedEvents.includes(evNum);

    setSelectedEvents((prev) =>
      isSelected
        ? prev.filter((e) => e !== evNum)
        : [...prev, evNum].sort((a, b) => a - b)
    );

    if (isSelected) {
      setHeatSel((prev) => {
        if (!(evNum in prev)) return prev;
        const updated = { ...prev };
        delete updated[evNum];
        return updated;
      });
      setLineSel((prev) => {
        if (!(evNum in prev)) return prev;
        const updated = { ...prev };
        delete updated[evNum];
        return updated;
      });
    }

    setOpenHeatMenu(null);
    setMenuPos(null);
    setError(null);
  }

  function handleHeatPick(evNum: number, heatNumber: number | "") {
    setHeatSel((prev) => ({ ...prev, [evNum]: heatNumber }));
    // Choosing a heat also selects the event.
    setSelectedEvents((prev) =>
      prev.includes(evNum) ? prev : [...prev, evNum].sort((a, b) => a - b)
    );
    closeHeatMenu();
    setError(null);
  }

  function handleLineChange(evNum: number, value: string) {
    setLineSel((prev) => ({ ...prev, [evNum]: value }));
    setError(null);
  }

  function clearAllEvents() {
    setSelectedEvents([]);
    setHeatSel({});
    setLineSel({});
    closeHeatMenu();
    setError(null);
  }

  async function handleSave() {
    if (saving) return;

    const trimmed = name.trim();

    if (!trimmed) {
      setError("Athlete name is required.");
      return;
    }

    if (selectedEvents.length === 0) {
      setError("Select at least one event.");
      return;
    }

    const heatsPayload: Record<number, number> = {};
    const linesPayload: Record<number, number> = {};

    for (const evNum of selectedEvents) {
      const hn = heatSel[evNum];
      if (typeof hn === "number") heatsPayload[evNum] = hn;

      // Optional line (lane) number — a positive integer.
      const rawLine = lineSel[evNum]?.trim() ?? "";
      if (rawLine !== "") {
        const ln = Number(rawLine);
        if (Number.isInteger(ln) && ln > 0) linesPayload[evNum] = ln;
      }
    }

    setSaving(true);
    setError(null);

    try {
      if (editingAthlete) {
        // Reconcile the existing athlete's registration — keeps scores on events that stay.
        await api.put(
          `/competition-athletes/${encodeURIComponent(editingAthlete.name)}`,
          {
            level,
            events: [...selectedEvents].sort((a, b) => a - b),
            heats: heatsPayload,
            lines: linesPayload,
          }
        );
      } else {
        await api.post("/competition-athletes/bulk", {
          name: trimmed,
          level,
          events: [...selectedEvents].sort((a, b) => a - b),
          heats: heatsPayload,
          lines: linesPayload,
        });
      }

      onSaved();
      onClose();

      setName("");
      setLevel("Beginner");
      setSelectedEvents([]);
      setHeatSel({});
      setLineSel({});
      closeHeatMenu();
      setError(null);
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to add athlete. Please try again.")
      );
    } finally {
      setSaving(false);
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && !saving) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-athlete-title"
        className="flex max-h-[90dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-[#29374E] bg-gradient-to-b from-[#0A0D12] to-[#070A0F] shadow-[0_20px_70px_rgba(0,0,0,0.6)]"
        dir="ltr"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-5">
          <div>
            <h2
              id="add-athlete-title"
              className="text-xl font-bold tracking-tight text-[#F5F6F8]"
            >
              {editingAthlete ? "Edit Athlete" : "Add Athlete"}
            </h2>
            <p className="mt-0.5 text-xs text-[#8193B5]">
              {editingAthlete
                ? "Change the athlete's events & heats"
                : "Register a new athlete for the competition"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close Add Athlete modal"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8193B5] transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79E8B8] disabled:opacity-50"
          >
            <IconX />
          </button>
        </div>

        {/* Form */}
        <div className="coach-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-4">
          {/* Name */}
          <div>
            <label htmlFor="add-athlete-name" className={labelClass}>
              Athlete Name
            </label>
            <input
              id="add-athlete-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="e.g. John Doe"
              autoFocus
              disabled={saving}
              readOnly={!!editingAthlete}
              className="w-full rounded-xl border border-[#34465D] bg-[#0B0F15] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-[#71819F] focus:border-[#79E8B8] focus:ring-1 focus:ring-[#79E8B8]/20 disabled:opacity-60"
            />
          </div>

          {/* Level */}
          <div>
            <span className={labelClass}>Level</span>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((lvl) => {
                const isActive = level === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleLevelChange(lvl)}
                    disabled={saving}
                    aria-pressed={isActive}
                    className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79E8B8] sm:text-sm ${
                      isActive
                        ? "border-[#79E8B8] bg-[#79E8B8]/[0.09] text-[#91F0C8]"
                        : "border-[#344157] text-[#B1BED5] hover:border-[#52647E] hover:text-white"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Events & heats */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A5B4D0]">
                Events &amp; Heats
                <span className="ml-2 rounded-full bg-[#79E8B8]/10 px-1.5 py-0.5 text-[10px] text-[#79E8B8]">
                  {selectedEvents.length}
                </span>
              </span>

              {selectedEvents.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllEvents}
                  disabled={saving}
                  className="text-[11px] font-medium text-[#8193B5] transition hover:text-[#91F0C8] disabled:opacity-50"
                >
                  Clear all
                </button>
              )}
            </div>

            {scheduleLoading ? (
              <p className="rounded-lg border border-dashed border-[#344157] py-6 text-center text-xs text-[#71819F]">
                Loading events…
              </p>
            ) : scheduleEvents.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#344157] py-6 text-center text-xs text-[#71819F]">
                No events available for this level yet — add heats from the Schedule manager.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {scheduleEvents.map((ev) => {
                  const isSelected = selectedEvents.includes(ev.event_number);

                  return (
                    <div
                      key={ev.id}
                      className={`relative flex aspect-square flex-col justify-between rounded-xl border p-2 transition-colors ${
                        isSelected
                          ? "border-[#79E8B8] bg-[#79E8B8]/[0.08]"
                          : "border-[#344157] bg-[#0B0F15] hover:border-[#52647E]"
                      }`}
                    >
                      {/* Select / deselect circle, pinned to the top right */}
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                          isSelected
                            ? "border-[#79E8B8] bg-[#79E8B8] text-[#07110D]"
                            : "border-[#52647E] text-transparent"
                        }`}
                      >
                        {isSelected && <IconCheck />}
                      </span>

                      {/* Clickable area: event label + number */}
                      <button
                        type="button"
                        onClick={() => toggleEvent(ev.event_number)}
                        disabled={saving}
                        aria-pressed={isSelected}
                        aria-label={`${isSelected ? "Deselect" : "Select"} ${eventLabel(ev.event_number)}`}
                        className={`flex flex-1 flex-col rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79E8B8] ${
                          isSelected ? "text-[#91F0C8]" : "text-[#A5B4D0] hover:text-white"
                        }`}
                      >
                        <span className="text-[9px] font-semibold uppercase tracking-[0.1em]">
                          {eventLabel(ev.event_number)}
                        </span>

                        <span className="flex flex-1 items-center justify-center text-3xl font-bold leading-none">
                          {ev.event_number === 1 ? "1&2" : ev.event_number}
                        </span>
                      </button>

                      </div>
                  );
                })}
              </div>
            )}

            {selectedEvents.length > 0 && (
              <div className="mt-2.5 rounded-lg border border-[#29374E] bg-[#0B0F15]/60 p-2.5">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8193B5]">
                  Assign heat &amp; line ({selectedEvents.length})
                </span>
                <div className="space-y-2">
                  {selectedEvents.map((evNum) => {
                    const ev = scheduleEvents.find((e) => e.event_number === evNum);
                    if (!ev) return null;
                    const heatValue = heatSel[evNum] ?? "";
                    const hasHeats = ev.heats.length > 0;
                    const selectedHeat =
                      typeof heatValue === "number"
                        ? ev.heats.find((h) => h.heat_number === heatValue)
                        : undefined;
                    const selectedHeatLabel = hasHeats
                      ? selectedHeat
                        ? `Heat ${selectedHeat.heat_number} · ${fmtTime(selectedHeat.start_time)}`
                        : "No heat"
                      : "No heats added";
                    return (
                      <div key={evNum} className="flex items-center gap-2">
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#344157] bg-[#0B0F15] px-2 py-1.5 text-[10px] font-bold text-[#A5B4D0]">
                          {eventLabel(evNum)}
                        </span>
                        <div className="relative min-w-0 flex-1">
                          <button
                            type="button"
                            ref={openHeatMenu === evNum ? heatBtnRef : null}
                            onClick={(e) => toggleHeatMenu(evNum, e.currentTarget)}
                            disabled={saving || !hasHeats}
                            aria-haspopup="listbox"
                            aria-expanded={openHeatMenu === evNum}
                            aria-label={`Heat for ${eventLabel(evNum)}`}
                            className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold outline-none transition focus:border-[#79E8B8] disabled:cursor-not-allowed disabled:opacity-50 ${
                              openHeatMenu === evNum
                                ? "border-[#79E8B8] bg-[#0A1513] text-white"
                                : "border-[#344157] bg-[#0B0F15] text-white hover:border-[#52647E]"
                            }`}
                          >
                            <span className="truncate">{selectedHeatLabel}</span>
                            <svg
                              width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              className={`shrink-0 text-[#71819F] transition-transform duration-200 ${openHeatMenu === evNum ? "rotate-180" : ""}`}
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </button>

                          {openHeatMenu === evNum && menuPos && (
                            <div
                              ref={heatMenuRef}
                              role="listbox"
                              style={{
                                position: "fixed",
                                top: menuPos.top,
                                left: menuPos.left,
                                minWidth: menuPos.width,
                                zIndex: 9999,
                              }}
                              className="coach-scroll max-h-56 overflow-y-auto rounded-lg border border-[#344157] bg-[#0B0F15] py-1 shadow-xl shadow-black/60"
                            >
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={heatValue === ""}
                                  onClick={() => handleHeatPick(evNum, "")}
                                  className={`flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs font-medium transition ${
                                    heatValue === ""
                                      ? "bg-[#79E8B8]/10 text-[#79E8B8]"
                                      : "text-[#B1BED5] hover:bg-white/5 hover:text-white"
                                  }`}
                                >
                                  {heatValue === "" && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                                  )}
                                  <span className={heatValue === "" ? "" : "pl-4"}>
                                    {hasHeats ? "No heat" : "No heats added"}
                                  </span>
                                </button>
                                {ev.heats.map((h) => {
                                  const isSel = heatValue === h.heat_number;
                                  return (
                                    <button
                                      key={h.id}
                                      type="button"
                                      role="option"
                                      aria-selected={isSel}
                                      onClick={() => handleHeatPick(evNum, h.heat_number)}
                                      className={`flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-xs transition ${
                                        isSel
                                          ? "bg-[#79E8B8]/10 text-[#79E8B8]"
                                          : "text-[#B1BED5] hover:bg-white/5 hover:text-white"
                                      }`}
                                    >
                                      <span className="flex min-w-0 items-center gap-2">
                                        {isSel && (
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                                        )}
                                        <span className={`truncate ${isSel ? "" : "pl-4"}`}>
                                          Heat {h.heat_number}
                                        </span>
                                      </span>
                                      <span className="shrink-0 text-[10px] tabular-nums text-[#71819F]">
                                        {fmtTime(h.start_time)} – {fmtTime(h.end_time)}
                                      </span>
                                    </button>
                                  );
                                })}
                            </div>
                          )}
                        </div>

                        {/* Line (lane) number — same dark chip style as the heat button */}
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={lineSel[evNum] ?? ""}
                          onChange={(e) => handleLineChange(evNum, e.target.value)}
                          placeholder="Line"
                          aria-label={`Line for ${eventLabel(evNum)}`}
                          title="Line"
                          disabled={saving}
                          className="w-[4.25rem] shrink-0 rounded-lg border border-[#344157] bg-[#0B0F15] px-2 py-2 text-center text-xs font-semibold text-white outline-none transition placeholder:text-[#71819F] focus:border-[#79E8B8] disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]"
                        />
                        <button
                          type="button"
                          onClick={() => toggleEvent(evNum)}
                          disabled={saving}
                          title={`Remove ${eventLabel(evNum)}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#344157] text-[#8193B5] transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="mt-2 text-[11px] leading-4 text-[#8193B5]">
              Pick the events you want, then assign a heat and an optional line
              (lane number) to each one below. An athlete can be in one heat per event.
            </p>
          </div>
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs text-red-400"
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-[#29374E] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-[#344157] px-5 py-2 text-sm font-semibold text-[#B1BED5] transition hover:border-[#52647E] hover:bg-white/[0.03] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79E8B8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-[#79E8B8] px-6 py-2 text-sm font-bold text-[#07110D] transition hover:bg-[#91F0C8] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79E8B8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080B10] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : editingAthlete ? "Save Changes" : "Add Athlete"}
          </button>
        </div>
      </div>
    </div>
  );
}