"use client";

import MovementPicker from "./MovementPicker";
import { Field } from "./UiHelpers";
import type { Movement } from "./types";

type SingleFormState = {
  movement: Movement | null;
  reps: string;
  weight: string;
  restSeconds: string;
  tempo: string;
  notes: string;
  label: string;
  /** Multi-set rows — each has its own reps & weight */
  setRows: { reps: string; weight: string; id: string }[];
  /** Coach-prescribed intensity/effort fields */
  rpe: string;
  effort: string;
  zone: string;
};

type Props = {
  state: SingleFormState;
  onStateChange: (s: SingleFormState) => void;
  onMovementChange: (m: Movement | null) => void;
};

export default function SingleMovementForm({ state, onStateChange, onMovementChange }: Props) {
  const set = (key: keyof SingleFormState, value: any) => {
    onStateChange({ ...state, [key]: value });
  };

  function updateSetRow(index: number, field: "reps" | "weight", value: string) {
    const updated = [...state.setRows];
    updated[index] = { ...updated[index], [field]: value };
    set("setRows", updated);
  }

  function removeSetRow(index: number) {
    if (state.setRows.length <= 1) return;
    set("setRows", state.setRows.filter((_, i) => i !== index));
  }

  function addSetRow() {
    set("setRows", [...state.setRows, { reps: "", weight: "", id: Math.random().toString(36).slice(2, 9) }]);
  }

  // Show multi-set UI when movement is selected, otherwise show picker only
  const hasMovement = state.movement !== null;

  return (
    <div className="space-y-4">
      <Field label="Label" value={state.label} onChange={(v) => set("label", v)} placeholder="e.g. Strength" />

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-400">Movement</label>
        <MovementPicker
          value={state.movement}
          onChange={(m) => onMovementChange(m)}
          placeholder="Select movement"
        />
      </div>

      {/* ── Multi-set rows ──────────────────────────────────────────── */}
      {hasMovement && (
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-400">
            Sets <span className="font-normal text-gray-600">({state.setRows.length} total)</span>
          </p>
          <div className="space-y-2">
            {state.setRows.map((row, i) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-800 bg-gray-950/60 px-3 pt-2 pb-4"
              >
                <span className="text-[10px] font-semibold uppercase text-gray-500 min-w-[44px] text-center mt-2">
                  Set {i + 1}
                </span>
                <div>
                  <span className="block text-[10px] text-gray-600">Reps</span>
                  <input
                    type="text"
                    value={row.reps}
                    onChange={(e) => updateSetRow(i, "reps", e.target.value)}
                    placeholder="—"
                    className="w-14 rounded-lg border border-gray-800 bg-gray-950 px-2 py-1.5 text-center text-xs text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]"
                  />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-600">Weight</span>
                  <input
                    type="text"
                    value={row.weight}
                    onChange={(e) => updateSetRow(i, "weight", e.target.value)}
                    placeholder="—"
                    className="w-20 rounded-lg border border-gray-800 bg-gray-950 px-2 py-1.5 text-center text-xs text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]"
                  />
                </div>
                {state.setRows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSetRow(i)}
                    className="rounded-full border border-gray-800 mt-3 px-2 py-1 text-[10px] text-gray-500 transition hover:border-red-400 hover:text-red-400"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSetRow}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-800 py-2 text-sm text-gray-400 transition hover:border-[#B4E3BD]/50 hover:text-[#B4E3BD]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add set
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Rest" value={state.restSeconds} onChange={(v) => set("restSeconds", v)} placeholder="e.g. 1:30" />
        <Field label="Tempo" value={state.tempo} onChange={(v) => set("tempo", v)} placeholder="e.g. 20X1" />
      </div>

      {/* ── RPE / Effort / Zone ──────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Field label="RPE" value={state.rpe} onChange={(v) => set("rpe", v)} placeholder="e.g. 7-8" />
        <Field label="Effort" value={state.effort} onChange={(v) => set("effort", v)} placeholder="e.g. Moderate" />
        <Field label="Zone" value={state.zone} onChange={(v) => set("zone", v)} placeholder="e.g. Zone 2" />
      </div>

      <Field label="Notes" value={state.notes} onChange={(v) => set("notes", v)} textarea />
    </div>
  );
}

export type { SingleFormState };