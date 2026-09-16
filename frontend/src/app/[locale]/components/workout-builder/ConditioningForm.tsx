"use client";

import { Field, FormatSelector, ConfirmDialog } from "./UiHelpers";
import CondMovementRow from "./CondMovementRow";
import { newRowId } from "./section-formatter";
import type { MovementRowData, ConditioningFormat } from "./types";
import { useState, useEffect, useRef, type DragEvent } from "react";

const SCORE_TYPE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  AMRAP: [
    { value: "rounds", label: "Rounds" },
    { value: "reps", label: "Total Reps" },
    { value: "cal", label: "Calories" },
    { value: "meters", label: "Meters" },
  ],
  FOR_TIME: [
    { value: "time", label: "Finish Time" },
    { value: "reps", label: "Total Reps" },
    { value: "cal", label: "Calories" },
    { value: "meters", label: "Meters" },
  ],
  RFT: [
    { value: "time", label: "Finish Time" },
    { value: "reps", label: "Total Reps" },
    { value: "cal", label: "Calories" },
    { value: "meters", label: "Meters" },
  ],
  CHIPPER: [
    { value: "time", label: "Finish Time" },
    { value: "reps", label: "Total Reps" },
    { value: "cal", label: "Calories" },
    { value: "meters", label: "Meters" },
  ],
  EMOM: [
    { value: "reps", label: "Total Reps" },
    { value: "cal", label: "Calories" },
    { value: "meters", label: "Meters" },
  ],
  TABATA: [
    { value: "rounds", label: "Rounds" },
    { value: "reps", label: "Total Reps" },
    { value: "cal", label: "Calories" },
    { value: "meters", label: "Meters" },
  ],
};

export function getScoreTypeOptions(format: ConditioningFormat) {
  return SCORE_TYPE_OPTIONS[format] ?? [{ value: "rounds", label: "Rounds" }];
}

/**
 * Returns the first available score-type value for a given format,
 * or "" if the current value is already valid for that format.
 */
function defaultScoreType(format: ConditioningFormat, current: string): string {
  const opts = getScoreTypeOptions(format);
  // Keep current if it's valid for this format
  if (current && opts.some((o) => o.value === current)) return current;
  // Otherwise default to the first option
  return opts[0]?.value ?? "";
}

function addCustomScoreTarget(
  state: ConditioningFormState,
  onStateChange: (s: ConditioningFormState) => void,
  customValue: string
) {
  const trimmed = customValue.trim();
  if (!trimmed || !state.format) return;
  // Don't add duplicates
  const alreadyExists = getScoreTypeOptions(state.format).some((o) => o.value === trimmed);
  if (alreadyExists) return;
  onStateChange({
    ...state,
    customScoreTargets: [
      ...state.customScoreTargets,
      { value: trimmed, label: trimmed },
    ],
    scoreType: trimmed,
  });
}

type ConditioningFormState = {
  format: ConditioningFormat | null;
  durationMinutes: string;
  intervalMinutes: string;
  timeCapMinutes: string;
  rounds: string;
  workSeconds: string;
  restSecondsInterval: string;
  scoreType: string;
  movements: MovementRowData[];
  intervalGroups: { id: string; label: string; movements: MovementRowData[] }[];
  notes: string;
  label: string;
  /** Coach-prescribed intensity/effort fields */
  rpe: string;
  effort: string;
  zone: string;
  /** Custom score targets added on-the-fly by the coach (not persisted globally) */
  customScoreTargets: { value: string; label: string }[];
};

type Props = {
  state: ConditioningFormState;
  onStateChange: (s: ConditioningFormState) => void;
};

export default function ConditioningForm({ state, onStateChange }: Props) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the custom score input when it appears
  useEffect(() => {
    if (showCustomInput && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [showCustomInput]);

  const set = (key: keyof ConditioningFormState, value: any) => {
    onStateChange({ ...state, [key]: value });
  };

  // ── Auto-create first interval group for EMOM ──────────────────────
  useEffect(() => {
    if (state.format !== "EMOM") return;
    if (!state.intervalMinutes || !state.rounds) return;
    if (state.intervalGroups.length > 0) return;
    // Auto-create the first interval group with NO movements
    onStateChange({
      ...state,
      intervalGroups: [{
        id: `igroup_${Math.random().toString(36).slice(2, 9)}`,
        label: intervalGroupLabel(0),
        movements: [],
      }],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.format, state.intervalMinutes, state.rounds]);

  function addRow() {
    const isChipper = state.format === "CHIPPER";
    set("movements", [...state.movements, {
      movement_id: null, movement_name: "", reps: "", repsSets: isChipper ? ["", "", ""] : [], unit: "reps", weight: null, restSeconds: "", rowId: newRowId(),
    } as MovementRowData]);
  }

  function updateRow(index: number, fieldOrUpdates: keyof MovementRowData | Partial<MovementRowData>, value?: any) {
    const updated = [...state.movements];
    if (typeof fieldOrUpdates === "string") {
      updated[index] = { ...updated[index], [fieldOrUpdates]: value };
    } else {
      updated[index] = { ...updated[index], ...fieldOrUpdates };
    }
    set("movements", updated);
  }

  function removeRow(index: number) {
    set("movements", state.movements.filter((_, i) => i !== index));
  }

  // ── Move row (reorder) ──────────────────────────────────────────────
  function moveRow(fromIndex: number, toIndex: number) {
    const updated = [...state.movements];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    set("movements", updated);
  }

  // ── Auto-calculate duration for EMOM ────────────────────────────────
  function updateEmomDuration(interval: string, rnds: string): void {
    if (state.format === "EMOM" && interval && rnds) {
      const dur = Number(interval) * Number(rnds);
      if (dur > 0) {
        onStateChange({ ...state, intervalMinutes: interval, rounds: rnds, durationMinutes: String(dur) });
        return;
      }
    }
    onStateChange({ ...state, intervalMinutes: interval, rounds: rnds });
  }

  // ── EMOM interval groups ───────────────────────────────────────────
  function intervalGroupLabel(gIdx: number): string {
    const interval = Number(state.intervalMinutes) || 1;
    const startMin = gIdx * interval + 1;
    const endMin = (gIdx + 1) * interval;
    return `Minutes ${startMin} - ${endMin}`;
  }

  function addIntervalGroup() {
    const newIdx = state.intervalGroups.length;
    set("intervalGroups", [...state.intervalGroups, {
      id: `igroup_${Math.random().toString(36).slice(2, 9)}`,
      label: intervalGroupLabel(newIdx),
      movements: [],
    }]);
  }

  function removeIntervalGroup(index: number) {
    set("intervalGroups", state.intervalGroups.filter((_, i) => i !== index));
  }

  function addRowToGroup(gIdx: number) {
    const updatedGroups = [...state.intervalGroups];
    updatedGroups[gIdx] = {
      ...updatedGroups[gIdx],
      movements: [...updatedGroups[gIdx].movements, {
        movement_id: null, movement_name: "", reps: "", repsSets: [], unit: "reps", weight: null, restSeconds: "", rowId: newRowId(),
      } as MovementRowData],
    };
    set("intervalGroups", updatedGroups);
  }

  function updateRowInGroup(gIdx: number, mIdx: number, fieldOrUpdates: keyof MovementRowData | Partial<MovementRowData>, value?: any) {
    const updatedGroups = [...state.intervalGroups];
    const row = updatedGroups[gIdx].movements[mIdx];
    if (typeof fieldOrUpdates === "string") {
      updatedGroups[gIdx].movements[mIdx] = { ...row, [fieldOrUpdates]: value };
    } else {
      updatedGroups[gIdx].movements[mIdx] = { ...row, ...fieldOrUpdates };
    }
    set("intervalGroups", updatedGroups);
  }

  function removeRowFromGroup(gIdx: number, mIdx: number) {
    const updatedGroups = [...state.intervalGroups];
    updatedGroups[gIdx] = {
      ...updatedGroups[gIdx],
      movements: updatedGroups[gIdx].movements.filter((_, i) => i !== mIdx),
    };
    set("intervalGroups", updatedGroups);
  }

  // ── Drag-and-drop state ──────────────────────────────────────────────
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  function handleDragStart(e: DragEvent<HTMLDivElement>, i: number) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(i));
    setDragIdx(i);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, i: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    moveRow(dragIdx, i);
    setDragIdx(i);
  }

  function handleDragEnd() {
    setDragIdx(null);
  }

  const [confirmRemoveIdx, setConfirmRemoveIdx] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* ── Format picker ─────────────────────────────────────────── */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-gray-400">Format</label>
        <FormatSelector value={state.format} onChange={(f) => {
          // Single state update to avoid stale-closure overwrite bug
          onStateChange({
            ...state,
            format: f,
            scoreType: defaultScoreType(f, state.scoreType),
          });
        }} />
      </div>

      {/* ── Format-specific fields ────────────────────────────────── */}
      {state.format === "AMRAP" && (
        <Field label="Duration (min)" value={state.durationMinutes} onChange={(v) => set("durationMinutes", v)} placeholder="20" type="number" />
      )}
      {state.format === "EMOM" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Interval (min)" value={state.intervalMinutes} onChange={(v) => updateEmomDuration(v, state.rounds)} placeholder="2" type="number" />
          <Field label="Rounds" value={state.rounds} onChange={(v) => updateEmomDuration(state.intervalMinutes, v)} placeholder="5" type="number" />
        </div>
      )}
      {state.format === "EMOM" && state.intervalMinutes && state.rounds && (
        <div className="rounded-xl border border-[#B4E3BD]/20 bg-[#B4E3BD]/5 px-4 py-2.5">
          <p className="text-xs text-gray-500">
            Total: <span className="font-semibold text-[#B4E3BD]">{Number(state.intervalMinutes) * Number(state.rounds) * Math.max(state.intervalGroups.length, 1)} min</span>
            {" · "}
            <span className="font-semibold text-gray-300">{state.rounds}</span> rounds × <span className="font-semibold text-gray-300">{Math.max(state.intervalGroups.length, 1)}</span> interval{state.intervalGroups.length !== 1 ? "s" : ""} × <span className="font-semibold text-gray-300">{state.intervalMinutes}:00</span> each
          </p>
        </div>
      )}
      {state.format === "FOR_TIME" && (
        <Field label="Time Cap (min)" value={state.timeCapMinutes} onChange={(v) => set("timeCapMinutes", v)} placeholder="15" type="number" />
      )}
      {state.format === "RFT" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rounds" value={state.rounds} onChange={(v) => set("rounds", v)} placeholder="5" type="number" />
          <Field label="Time Cap (min)" value={state.timeCapMinutes} onChange={(v) => set("timeCapMinutes", v)} placeholder="15" type="number" />
        </div>
      )}
      {state.format === "TABATA" && (
        <div className="grid grid-cols-3 gap-3">
          <Field label="Work (sec)" value={state.workSeconds} onChange={(v) => set("workSeconds", v)} placeholder="20" type="number" />
          <Field label="Rest (sec)" value={state.restSecondsInterval} onChange={(v) => set("restSecondsInterval", v)} placeholder="10" type="number" />
          <Field label="Rounds" value={state.rounds} onChange={(v) => set("rounds", v)} placeholder="8" type="number" />
        </div>
      )}
      {state.format === "CHIPPER" && (
        <p className="text-xs text-gray-500">Ordered list of movements, performed once through.</p>
      )}

      {/* ── Score target ────────────────────────────────────────────── */}
      {state.format && (
        <div>
          <label className="mb-2 block text-xs font-semibold text-gray-400">Score target</label>
          <p className="mb-2 text-[10px] text-gray-600">What is the result based on?</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => set("scoreType", "")}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                state.scoreType === ""
                  ? "border-gray-600 bg-gray-800 text-gray-300"
                  : "border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-400"
              }`}
            >
              None
            </button>
            <span className="mx-1 self-stretch w-px bg-gray-800" />
            {getScoreTypeOptions(state.format).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("scoreType", opt.value)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                  state.scoreType === opt.value
                    ? "border-[#B4E3BD] bg-[#B4E3BD]/10 text-[#B4E3BD] shadow-sm shadow-[#B4E3BD]/10"
                    : "border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
            {/* ── Custom score targets (added on-the-fly) ──────────── */}
            {state.customScoreTargets.map((opt) => (
              <div
                key={opt.value}
                className={`group inline-flex items-center gap-0.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                  state.scoreType === opt.value
                    ? "border-yellow-500 bg-yellow-500/10 text-yellow-400 shadow-sm shadow-yellow-500/10"
                    : "border-yellow-500/30 text-yellow-500/70 hover:border-yellow-500/60 hover:text-yellow-400"
                }`}
                onClick={() => set("scoreType", opt.value)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); set("scoreType", opt.value); } }}
              >
                <span>{opt.label}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const filtered = state.customScoreTargets.filter((x) => x.value !== opt.value);
                    const nextScore = state.scoreType === opt.value ? "" : state.scoreType;
                    set("customScoreTargets", filtered);
                    if (nextScore !== state.scoreType) {
                      onStateChange({ ...state, customScoreTargets: filtered, scoreType: nextScore });
                    } else {
                      set("customScoreTargets", filtered);
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-full px-1 text-[9px] text-yellow-500/50 transition hover:text-red-400 hover:bg-red-500/10"
                  aria-label={`Remove ${opt.label}`}
                >
                  ✕
                </button>
              </div>
            ))}
            {/* ── "+" button to add a custom target ──────────────────── */}
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => { setShowCustomInput(true); setCustomInputValue(""); }}
                className="rounded-lg border border-dashed border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-500 transition hover:border-[#B4E3BD]/50 hover:text-[#B4E3BD]"
              >
                + Custom
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  ref={customInputRef}
                  type="text"
                  value={customInputValue}
                  onChange={(e) => setCustomInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addCustomScoreTarget(state, onStateChange, customInputValue);
                      setShowCustomInput(false);
                      setCustomInputValue("");
                    }
                    if (e.key === "Escape") {
                      setShowCustomInput(false);
                      setCustomInputValue("");
                    }
                  }}
                  onBlur={() => {
                    // Save on blur if there's content
                    if (customInputValue.trim()) {
                      addCustomScoreTarget(state, onStateChange, customInputValue);
                    }
                    setShowCustomInput(false);
                    setCustomInputValue("");
                  }}
                  placeholder="Type target name..."
                  className="w-32 rounded-lg border border-[#B4E3BD]/40 bg-gray-900 px-2 py-1.5 text-xs text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]"
                  maxLength={50}
                />
                <button
                  type="button"
                  onClick={() => { setShowCustomInput(false); setCustomInputValue(""); }}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs text-gray-500 transition hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EMOM: Intervals within each round ─────────────────────────── */}
      {state.format === "EMOM" && state.intervalMinutes && state.rounds && (
        <div className="border-t border-gray-800 pt-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#B4E3BD]">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            <p className="text-sm font-semibold text-gray-300">Intervals</p>
            <span className="text-[10px] text-gray-500">each {state.intervalMinutes}:00 · {state.intervalGroups.length} interval{state.intervalGroups.length !== 1 ? "s" : ""} = {Number(state.intervalMinutes) * Math.max(state.intervalGroups.length, 1)}:00 per round</span>
          </div>
          {state.intervalGroups.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-950/30 px-4 py-6 text-center">
              <p className="text-xs text-gray-500 mb-2">Add intervals to build one round. All {state.rounds} rounds repeat the same intervals.</p>
              <button type="button" onClick={addIntervalGroup}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#B4E3BD]/40 bg-[#B4E3BD]/10 px-5 py-2.5 text-sm font-bold text-[#B4E3BD] shadow-lg shadow-[#B4E3BD]/5 transition hover:bg-[#B4E3BD]/20 hover:border-[#B4E3BD] active:scale-[0.98]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                Add Interval
              </button>
            </div>
          )}
          {state.intervalGroups.length > 0 && (
            <>
              <div className="space-y-3">
                {state.intervalGroups.map((group, gIdx) => (
                  <div key={group.id} className="rounded-xl border border-[#B4E3BD]/30 bg-[#B4E3BD]/5 shadow-sm shadow-[#B4E3BD]/5">
                    <div className="flex items-center justify-between border-b border-[#B4E3BD]/10 px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#B4E3BD]">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <line x1="3" y1="9" x2="21" y2="9" />
                          <line x1="9" y1="3" x2="9" y2="21" />
                        </svg>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#B4E3BD]">{group.label}</p>
                      </div>
                      <button type="button" onClick={() => removeIntervalGroup(gIdx)}
                        className="text-[10px] text-gray-500 hover:text-red-400 transition">&times;</button>
                    </div>
                    <div className="p-3 space-y-2">
                      {group.movements.length === 0 && (
                        <p className="text-center text-[10px] text-gray-600 py-1">No movements — add one below</p>
                      )}
                      {group.movements.map((row, mIdx) => (
                        <CondMovementRow
                          key={row.rowId}
                          data={row}
                          onChange={(f, v) => updateRowInGroup(gIdx, mIdx, f, v)}
                          onRemove={() => removeRowFromGroup(gIdx, mIdx)}
                        />
                      ))}
                      <button type="button" onClick={() => addRowToGroup(gIdx)}
                        className="w-full rounded-lg border border-dashed border-gray-700 py-1.5 text-xs text-gray-500 transition hover:border-[#B4E3BD]/50 hover:text-[#B4E3BD]">
                        + Add Movement
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addIntervalGroup}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#B4E3BD]/30 bg-[#B4E3BD]/5 py-3 text-sm font-bold text-[#B4E3BD] transition hover:bg-[#B4E3BD]/10 hover:border-[#B4E3BD]/60">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                + Add Another Interval
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Movements (non-EMOM) ────────────────────────────────────── */}
      {state.format !== "EMOM" && (
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-300">Movements</p>
        {state.movements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-950/30 px-4 py-8 text-center">
            <p className="text-xs text-gray-500">No movements added yet. Click below to add one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {state.movements.map((row, i) => (
              <div
                key={row.rowId}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                className={`group relative rounded-xl border transition-all ${
                  dragIdx === i
                    ? "border-[#B4E3BD] bg-[#B4E3BD]/10 opacity-70"
                    : "border-gray-800 bg-gray-950/60 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-1 px-3 pt-3 pb-0">
                  <span
                    className="cursor-grab rounded p-0.5 text-gray-600 transition hover:text-gray-300 active:cursor-grabbing"
                    aria-label="Drag to reorder"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600">
                      <circle cx="8" cy="6" r="1.5" />
                      <circle cx="16" cy="6" r="1.5" />
                      <circle cx="8" cy="12" r="1.5" />
                      <circle cx="16" cy="12" r="1.5" />
                      <circle cx="8" cy="18" r="1.5" />
                      <circle cx="16" cy="18" r="1.5" />
                    </svg>
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-gray-600">Movement {i + 1}</span>
                </div>
                <div className="px-3 pb-3">
                  <CondMovementRow
                    data={row}
                    onChange={(f, v) => updateRow(i, f, v)}
                    onRemove={() => setConfirmRemoveIdx(i)}
                    chipper={state.format === "CHIPPER"}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={addRow}
          className="mt-2 w-full rounded-xl border border-dashed border-gray-800 py-2 text-sm text-gray-400 transition hover:border-[#B4E3BD]/50 hover:text-[#B4E3BD]">
          + Add Movement
        </button>
      </div>
      )}

      {/* ── RPE / Effort / Zone ──────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Field label="RPE" value={state.rpe} onChange={(v) => set("rpe", v)} placeholder="e.g. 7-8" />
        <Field label="Effort" value={state.effort} onChange={(v) => set("effort", v)} placeholder="e.g. Moderate" />
        <Field label="Zone" value={state.zone} onChange={(v) => set("zone", v)} placeholder="e.g. Zone 2" />
      </div>

      <Field label="Notes" value={state.notes} onChange={(v) => set("notes", v)} textarea />
      <Field label="Label" value={state.label} onChange={(v) => set("label", v)} placeholder={state.format || "Metcon"} />

      <ConfirmDialog
        open={confirmRemoveIdx !== null}
        title="Remove movement"
        message="Are you sure you want to remove this movement from the workout?"
        confirmLabel="Remove"
        onConfirm={() => { if (confirmRemoveIdx !== null) removeRow(confirmRemoveIdx); setConfirmRemoveIdx(null); }}
        onCancel={() => setConfirmRemoveIdx(null)}
      />
    </div>
  );
}

export type { ConditioningFormState };