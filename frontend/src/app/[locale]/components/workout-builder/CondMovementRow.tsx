"use client";

import type { MovementRowData, Movement } from "./types";
import MovementPicker from "./MovementPicker";

type Props = {
  data: MovementRowData;
  onChange: (fieldOrUpdates: keyof MovementRowData | Partial<MovementRowData>, value?: any) => void;
  onRemove: () => void;
  /** Movement IDs already used by sibling rows in the same section — excludes this row's own ID. */
  excludeIds?: number[];
};

export default function CondMovementRow({ data, onChange, onRemove, excludeIds }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-800 bg-gray-950/60 p-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        <MovementPicker
          value={data.movement_id ? { id: data.movement_id, name: data.movement_name, default_unit: data.unit } as Movement : null}
          onChange={(m) => { onChange({ movement_id: m.id, movement_name: m.name, unit: m.default_unit }); }}
          placeholder="Select movement"
          excludeIds={excludeIds}
        />
      </div>
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
        <button type="button" onClick={onRemove}
          className="mt-4 shrink-0 rounded-full border border-gray-800 px-2 py-1 text-xs text-gray-500 transition hover:border-red-400 hover:text-red-400">✕</button>
      </div>
    </div>
  );
}