"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Field, ConfirmDialog } from "./UiHelpers";
import CondMovementRow from "./CondMovementRow";
import { newRowId } from "./section-formatter";
import type { MovementRowData } from "./types";

type ComplexFormState = {
  selectedComplexId: number | null;
  complexName: string;
  movements: MovementRowData[];
  sets: string;
  weight: string;
  restSeconds: string;
  notes: string;
  label: string;
};

type Props = {
  state: ComplexFormState;
  onStateChange: (s: ComplexFormState) => void;
};

export default function ComplexForm({ state, onStateChange }: Props) {
  const set = (key: keyof ComplexFormState, value: any) => {
    onStateChange({ ...state, [key]: value });
  };

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [confirmRemoveIdx, setConfirmRemoveIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    let cancelled = false;
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api.get<any[]>(`/complexes?q=${encodeURIComponent(query.trim())}`);
        if (!cancelled) setResults(data);
      } catch { /* silently fail */ }
      finally { if (!cancelled) setSearchLoading(false); }
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  function selectComplex(c: any) {
    set("selectedComplexId", c.id);
    set("complexName", c.name);
    set("movements", (c.movements || []).map((m: any) => ({
      movement_id: m.movement_id,
      movement_name: m.movement_name,
      reps: m.reps || "",
      unit: "reps",
      weight: null,
      rowId: newRowId(),
    })));
  }

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

  function moveRow(fromIndex: number, toIndex: number) {
    const updated = [...state.movements];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    set("movements", updated);
  }

  function usedMovementIds(excludeIndex: number): number[] {
    return state.movements
      .filter((_, i) => i !== excludeIndex)
      .map((r) => r.movement_id)
      .filter((id): id is number => id !== null);
  }

return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-400">Search saved complexes</label>
        <input type="text" value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search complexes..."
          className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]"
        />
        {searchLoading && <p className="mt-1 text-xs text-gray-500">Searching...</p>}
        {!searchLoading && results.length > 0 && (
          <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900">
            {results.map((c: any) => (
              <button key={c.id} type="button" onClick={() => selectComplex(c)}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm transition hover:bg-gray-800 ${
                  state.selectedComplexId === c.id ? "bg-[#B4E3BD]/10 text-[#B4E3BD]" : "text-white"
                }`}>
                <span className="flex-1 font-medium">{c.name}</span>
                <span className="text-[10px] text-gray-500">{c.movements?.length || 0} movements</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Field label="Complex Name" value={state.complexName} onChange={(v) => set("complexName", v)} placeholder="e.g. Bear Complex" />
      <div className="grid grid-cols-3 gap-3">
        <Field label="Sets" value={state.sets} onChange={(v) => set("sets", v)} placeholder="3" type="number" />
        <Field label="Weight" value={state.weight} onChange={(v) => set("weight", v)} placeholder="60kg" />
        <Field label="Rest (sec)" value={state.restSeconds} onChange={(v) => set("restSeconds", v)} placeholder="120" type="number" />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-gray-300">Movements</p>
        {state.movements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-950/30 px-4 py-8 text-center">
            <p className="text-xs text-gray-500">No movements added yet. Click below to add one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {state.movements.map((row, i) => (
              <div key={row.rowId} className="group relative">
                <div className="mb-1 flex items-center gap-1 px-1">
                  <button type="button" onClick={() => moveRow(i, i - 1)} disabled={i === 0}
                    className="rounded p-0.5 text-gray-600 transition hover:text-gray-300 disabled:opacity-20"
                    aria-label="Move up"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => moveRow(i, i + 1)} disabled={i === state.movements.length - 1}
                    className="rounded p-0.5 text-gray-600 transition hover:text-gray-300 disabled:opacity-20"
                    aria-label="Move down"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <span className="text-[10px] font-semibold uppercase text-gray-600">Movement {i + 1}</span>
                </div>
                <CondMovementRow
                  data={row}
                  onChange={(f, v) => updateRow(i, f, v)}
                  onRemove={() => setConfirmRemoveIdx(i)}
                  excludeIds={usedMovementIds(i)}
                />
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
      <Field label="Label" value={state.label} onChange={(v) => set("label", v)} placeholder="e.g. Complex" />

      <ConfirmDialog
        open={confirmRemoveIdx !== null}
        title="Remove movement"
        message="Are you sure you want to remove this movement from the complex?"
        confirmLabel="Remove"
        onConfirm={() => { if (confirmRemoveIdx !== null) removeRow(confirmRemoveIdx); setConfirmRemoveIdx(null); }}
        onCancel={() => setConfirmRemoveIdx(null)}
      />
    </div>
  );
}

export type { ComplexFormState };