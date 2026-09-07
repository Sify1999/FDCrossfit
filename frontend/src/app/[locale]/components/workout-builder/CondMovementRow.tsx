"use client";

import { useState } from "react";
import type { MovementRowData, Movement } from "./types";
import MovementPicker from "./MovementPicker";

type Props = {
  data: MovementRowData;
  onChange: (fieldOrUpdates: keyof MovementRowData | Partial<MovementRowData>, value?: any) => void;
  onRemove: () => void;
  /** When true, renders multiple reps-sets (used for CHIPPER format) */
  chipper?: boolean;
};

export default function CondMovementRow({ data, onChange, onRemove, chipper }: Props) {
  // ── Chipper multi-set helpers ──────────────────────────────────────────
  function setRepsSet(index: number, value: string) {
    const updated = [...(data.repsSets || [])];
    updated[index] = value;
    onChange("repsSets", updated);
  }

  function addRepsSet() {
    const updated = [...(data.repsSets || []), ""];
    onChange("repsSets", updated);
  }

  function removeRepsSet(index: number) {
    const updated = (data.repsSets || []).filter((_, i) => i !== index);
    onChange("repsSets", updated.length > 0 ? updated : [""]);
  }

  const repsSets = data.repsSets?.length ? data.repsSets : [""];
  const [restExpanded, setRestExpanded] = useState(false);
  const showRestInput = restExpanded || Boolean(data.restSeconds?.trim());

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-800 bg-gray-950/60 p-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="min-w-[160px] flex-1">
        <MovementPicker
          value={data.movement_id ? { id: data.movement_id, name: data.movement_name, default_unit: data.unit } as Movement : null}
          onChange={(m) => { onChange({ movement_id: m.id, movement_name: m.name, unit: m.default_unit }); }}
          placeholder="Select movement"
        />
      </div>

      {chipper ? (
        /* ── CHIPPER: multi-set reps + unit + weight ──────────────────── */
        <div className="flex flex-wrap items-center gap-1.5">
          {repsSets.map((val, i) => (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-xs text-gray-500">-</span>}
              <div className="relative">
                <input
                  type="text"
                  value={val}
                  onChange={(e) => setRepsSet(i, e.target.value)}
                  placeholder="0"
                  className="w-12 rounded-lg border border-gray-800 bg-gray-950 px-2 py-1.5 text-center text-xs text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]"
                />
                {repsSets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRepsSet(i)}
                    className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-700 text-[8px] text-gray-400 transition hover:bg-red-500 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addRepsSet}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-gray-600 text-xs text-gray-400 transition hover:border-[#B4E3BD] hover:text-[#B4E3BD]"
            title="Add set"
          >
            +
          </button>
          <div>
            <span className="block text-[10px] text-gray-600">Unit</span>
            <select value={data.unit} onChange={(e) => onChange("unit", e.target.value)}
              className="rounded-lg border border-gray-800 bg-gray-950 px-2 py-1.5 text-xs text-white outline-none focus:border-[#B4E3BD]">
              <option value="reps">reps</option>
              <option value="cal">cal</option>
              <option value="m">m</option>
              <option value="sec">sec</option>
            </select>
          </div>
          <div>
            <span className="block text-[10px] text-gray-600">Weight</span>
            <input type="text" value={data.weight || ""} onChange={(e) => onChange("weight", e.target.value || null)}
              placeholder="-" className="w-16 rounded-lg border border-gray-800 bg-gray-950 px-2 py-1.5 text-xs text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]" />
          </div>
        </div>
      ) : (
        /* ── Standard: single reps + unit + weight ───────────────────── */
        <div className="flex items-center gap-2">
          <div>
            <span className="block text-[10px] text-gray-600">Reps/Dist</span>
            <input type="text" value={data.reps} onChange={(e) => onChange("reps", e.target.value)}
              placeholder="10" className="w-16 rounded-lg border border-gray-800 bg-gray-950 px-2 py-1.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-[#B4E3BD]" />
          </div>
          <div>
            <span className="block text-[10px] text-gray-600">Unit</span>
            <select value={data.unit} onChange={(e) => onChange("unit", e.target.value)}
              className="rounded-lg border border-gray-800 bg-gray-950 px-2 py-1.5 text-xs text-white outline-none focus:border-[#B4E3BD]">
              <option value="reps">reps</option>
              <option value="cal">cal</option>
              <option value="m">m</option>
              <option value="sec">sec</option>
            </select>
          </div>
          <div>
            <span className="block text-[10px] text-gray-600">Weight</span>
            <input type="text" value={data.weight || ""} onChange={(e) => onChange("weight", e.target.value || null)}
              placeholder="-" className="w-16 rounded-lg border border-gray-800 bg-gray-950 px-2 py-1.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-[#B4E3BD]" />
          </div>
        </div>
      )}

      {/* ── Rest after each set/movement ────────────────────────────────── */}
      <div>
        <span className="block text-[10px] text-gray-600">Rest (sec)</span>
        {showRestInput ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={data.restSeconds ?? ""}
              onChange={(e) => onChange("restSeconds", e.target.value)}
              placeholder="30"
              className="w-12 rounded-lg border border-gray-800 bg-gray-950 px-2 py-1.5 text-center text-xs text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]"
            />
            <button
              type="button"
              onClick={() => { onChange("restSeconds", ""); setRestExpanded(false); }}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-700 text-[9px] text-gray-400 transition hover:bg-red-500 hover:text-white"
              title="Remove rest"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { onChange("restSeconds", "30"); setRestExpanded(true); }}
            className="rounded-lg border border-dashed border-gray-700 px-2 py-1.5 text-xs text-gray-400 transition hover:border-[#B4E3BD] hover:text-[#B4E3BD]"
            title="Add rest after each set/movement"
          >
            Add
          </button>
        )}
      </div>

      <button type="button" onClick={onRemove}
        className="shrink-0 self-center rounded-full border border-gray-800 px-2 py-1 text-xs text-gray-500 transition hover:border-red-400 hover:text-red-400">✕</button>
    </div>
  );
}