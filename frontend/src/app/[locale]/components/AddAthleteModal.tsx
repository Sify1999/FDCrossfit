"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
import { useBodyScrollLock } from "./useScrollLock";
import { eventLabel, levelHasEvent } from "@/lib/competition-events";

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

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** When set, the modal edits this athlete's level / heats / lines instead of adding a new one. */
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

/** "08:25" → "8:25 AM" — used to show the heat time in the menu. */
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
  // Heat + line per event number (every event of the level is always listed).
  const [heatSel, setHeatSel] = useState<Record<number, number | "">>({});
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
          .filter(
            (e) =>
              e.level === level.toLowerCase() &&
              levelHasEvent(level, e.event_number)
          )
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

  // Pre-fill the form when editing, reset it when adding.
  useEffect(() => {
    if (!open) return;
    if (editingAthlete) {
      setName(editingAthlete.name);
      setLevel(editingAthlete.level);
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
    // Heats belong to a level, so a level change starts from a clean slate.
    setLevel(next);
    setHeatSel({});
    setLineSel({});
    closeHeatMenu();
    setError(null);
  }

  function handleHeatPick(evNum: number, heatNumber: number | "") {
    setHeatSel((prev) => ({ ...prev, [evNum]: heatNumber }));
    closeHeatMenu();
    setError(null);
  }

  function handleLineChange(evNum: number, value: string) {
    setLineSel((prev) => ({ ...prev, [evNum]: value }));
    setError(null);
  }

  async function handleSave() {
    if (saving) return;

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Athlete name is required.");
      return;
    }

    // Every listed event is sent explicitly (null = no heat / no line), so
    // clearing works. Events that aren't listed are never touched server-side.
    const heats: Record<number, number | null> = {};
    const lines: Record<number, number | null> = {};
    for (const ev of scheduleEvents) {
      const hn = heatSel[ev.event_number];
      heats[ev.event_number] = typeof hn === "number" ? hn : null;

      const raw = (lineSel[ev.event_number] ?? "").trim();
      const ln = Number(raw);
      lines[ev.event_number] =
        raw !== "" && Number.isInteger(ln) && ln > 0 ? ln : null;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingAthlete) {
        await api.put(
          `/competition-athletes/${encodeURIComponent(editingAthlete.name)}`,
          { level, heats, lines }
        );
      } else {
        await api.post("/competition-athletes/bulk", {
          name: trimmed,
          level,
          heats,
          lines,
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to save athlete. Please try again.")
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
                ? "Change the level, heats and lines — scores are kept"
                : "Register a new athlete — all events of the level are added automatically"}
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

          {/* Heat & line per event */}
          <div>
            <span className={labelClass}>Heat &amp; Line (optional)</span>

            {scheduleLoading ? (
              <p className="rounded-lg border border-dashed border-[#344157] py-6 text-center text-xs text-[#71819F]">
                Loading events…
              </p>
            ) : scheduleEvents.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#344157] py-6 text-center text-xs text-[#71819F]">
                No events available for this level yet.
              </p>
            ) : (
              <div className="space-y-2 rounded-lg border border-[#29374E] bg-[#0B0F15]/60 p-2.5">
                {scheduleEvents.map((ev) => {
                  const evNum = ev.event_number;
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
                    <div key={ev.id} className="flex items-center gap-2">
                      <span className="inline-flex w-[5.25rem] shrink-0 items-center justify-center rounded-md border border-[#344157] bg-[#0B0F15] px-2 py-1.5 text-[10px] font-bold text-[#A5B4D0]">
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
                              <span className={heatValue === "" ? "" : "pl-4"}>No heat</span>
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
                                  <span className={`truncate ${isSel ? "" : "pl-4"}`}>
                                    Heat {h.heat_number}
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

                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={lineSel[evNum] ?? ""}
                        onChange={(e) => handleLineChange(evNum, e.target.value)}
                        placeholder="Line"
                        aria-label={`Line for ${eventLabel(evNum)}`}
                        disabled={saving}
                        className="w-[4.25rem] shrink-0 rounded-lg border border-[#344157] bg-[#0B0F15] px-2 py-2 text-center text-xs font-semibold text-white outline-none transition placeholder:text-[#71819F] focus:border-[#79E8B8] disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <p className="mt-2 text-[11px] leading-4 text-[#8193B5]">
              The athlete is automatically registered for every event of the level.
              Heat and line are optional and can be set later.
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