"use client";

import { Field, FormatSelector } from "./UiHelpers";
import CondMovementRow from "./CondMovementRow";
import { newRowId } from "./section-formatter";
import type { MovementRowData, ConditioningFormat } from "./types";
import { useState } from "react";

type ConditioningFormState = {
  format: ConditioningFormat | null;
  durationMinutes: string;
  intervalMinutes: string;
  timeCapMinutes: string;
  rounds: string;
  workSeconds: string;
  restSecondsInterval: string;
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
    set("movements", [...state.movements, {
      movement_id: null, movement_name: "", reps: "", unit: "reps", weight: null, rowId: newRowId(),
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

  function usedMovementIds(excludeIndex: number): number[] {
    return state.movements
      .filter((_, i) => i !== excludeIndex)
      .map((r) => r.movement_id)
      .filter((id): id is number => id !== null);
  }

  const [confirmRemoveIdx, setConfirmRemoveIdx] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* ── Format picker ─────────────────────────────────────────── */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-gray-400">Format</label>
        <FormatSelector value={state.format} onChange={(f) => set("format", f)} />
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
        <Field label="Rounds" value={state.rounds} onChange={(v) => set("rounds", v)} placeholder="5" type="number" />
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
              <CondMovementRow
                key={row.rowId}
                data={row}
                onChange={(f, v) => updateRow(i, f, v)}
                onRemove={() => setConfirmRemoveIdx(i)}
                excludeIds={usedMovementIds(i)}
              />
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
    </div>
  );
}

export type { ConditioningFormState };