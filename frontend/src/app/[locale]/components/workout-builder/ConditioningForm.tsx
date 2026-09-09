"use client";

import { Field, FormatSelector, ConfirmDialog } from "./UiHelpers";
import CondMovementRow from "./CondMovementRow";
import { newRowId } from "./section-formatter";
import type { MovementRowData, ConditioningFormat } from "./types";
import { useState, type DragEvent } from "react";

const SCORE_TYPE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  AMRAP: [
    { value: "rounds", label: "Rounds" },
    { value: "cal", label: "Calories" },
    { value: "meters", label: "Meters" },
    { value: "reps", label: "Total reps" },
  ],
  FOR_TIME: [
    { value: "time", label: "Finish time" },
    { value: "cal", label: "Calories" },
    { value: "meters", label: "Meters" },
  ],
  RFT: [
    { value: "time", label: "Finish time" },
  ],
  CHIPPER: [
    { value: "time", label: "Finish time" },
  ],
  EMOM: [
    { value: "rounds", label: "Rounds" },
    { value: "cal", label: "Calories" },
    { value: "meters", label: "Meters" },
  ],
  TABATA: [
    { value: "rounds", label: "Rounds" },
  ],
};

function getScoreTypeOptions(format: ConditioningFormat) {
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
  notes: string;
  label: string;
};

type Props = {
  state: ConditioningFormState;
  onStateChange: (s: ConditioningFormState) => void;
};

export default function ConditioningForm({ state, onStateChange }: Props) {
  const set = (key: keyof ConditioningFormState, value: any) => {
    onStateChange({ ...state, [key]: value });
  };

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
          <Field label="Duration (min)" value={state.durationMinutes} onChange={(v) => set("durationMinutes", v)} placeholder="20" type="number" />
          <Field label="Interval (min)" value={state.intervalMinutes} onChange={(v) => set("intervalMinutes", v)} placeholder="1" type="number" />
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
          <div className="flex flex-wrap gap-1.5">
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
          </div>
        </div>
      )}

      {/* ── Movements ────────────────────────────────────────────── */}
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