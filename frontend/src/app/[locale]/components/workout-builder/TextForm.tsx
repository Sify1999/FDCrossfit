"use client";

import { Field } from "./UiHelpers";

type TextFormState = {
  label: string;
  content: string;
};

type Props = {
  state: TextFormState;
  onStateChange: (s: TextFormState) => void;
};

export default function TextForm({ state, onStateChange }: Props) {
  const set = (key: keyof TextFormState, value: any) => {
    onStateChange({ ...state, [key]: value });
  };

  return (
    <div className="space-y-4">
      <Field label="Title" value={state.label} onChange={(v) => set("label", v)} placeholder="e.g. Warm Up" />
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-400">Content</label>
        <textarea value={state.content}
          onChange={(e) => set("content", e.target.value)}
          placeholder="e.g. 10 min easy bike, 5 min dynamic stretches, 20 air squats, 10 push-ups, 10 scorpions"
          rows={8}
          className="w-full resize-y rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]"
        />
      </div>
    </div>
  );
}

export type { TextFormState };