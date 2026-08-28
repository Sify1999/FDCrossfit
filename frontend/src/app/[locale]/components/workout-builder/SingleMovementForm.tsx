"use client";

import MovementPicker from "./MovementPicker";
import { Field } from "./UiHelpers";
import type { Movement } from "./types";

type SingleFormState = {
  movement: Movement | null;
  sets: string;
  reps: string;
  weight: string;
  restSeconds: string;
  tempo: string;
  notes: string;
  label: string;
};

type Props = {
  state: SingleFormState;
  onStateChange: (s: SingleFormState) => void;
  onMovementChange: (m: Movement | null) => void;
  excludeMovementIds?: number[];
};

export default function SingleMovementForm({ state, onStateChange, onMovementChange, excludeMovementIds }: Props) {
  const set = (key: keyof SingleFormState, value: any) => {
    onStateChange({ ...state, [key]: value });
  };

  return (
    <div className="space-y-4">
      <Field label="Label" value={state.label} onChange={(v) => set("label", v)} placeholder="e.g. Strength" />
      <MovementPicker
        value={state.movement}
        onChange={(m) => onMovementChange(m)}
        placeholder="Select movement"
        excludeIds={excludeMovementIds}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Sets" value={state.sets} onChange={(v) => set("sets", v)} placeholder="5" type="number" />
        <Field label="Reps" value={state.reps} onChange={(v) => set("reps", v)} placeholder="5" type="number" />
        <Field label="Weight" value={state.weight} onChange={(v) => set("weight", v)} placeholder="80kg" />
        <Field label="Rest (sec)" value={state.restSeconds} onChange={(v) => set("restSeconds", v)} placeholder="90" type="number" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tempo" value={state.tempo} onChange={(v) => set("tempo", v)} placeholder="e.g. 20X1" />
        <Field label="Notes" value={state.notes} onChange={(v) => set("notes", v)} textarea />
      </div>
    </div>
  );
}

export type { SingleFormState };