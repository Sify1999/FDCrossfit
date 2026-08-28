"use client";

import { useState } from "react";
import type { ConditioningFormat } from "./types";

// ─── Card for section-type selection ────────────────────────────────

export function TypeCard({ title, desc, icon, onClick, active }: {
  title: string; desc: string; icon: string; onClick: () => void; active?: boolean;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
        active
          ? "border-[#B4E3BD] bg-[#B4E3BD]/10 ring-1 ring-[#B4E3BD]/30"
          : "border-gray-800 bg-gray-950/60 hover:border-[#B4E3BD]/60 hover:bg-gray-900"
      }`}>
      <span className="text-2xl">{icon}</span>
      <span className={`text-sm font-bold ${active ? "text-[#B4E3BD]" : "text-white"}`}>{title}</span>
      <span className="text-xs text-gray-500">{desc}</span>
    </button>
  );
}

// ─── Generic form field ─────────────────────────────────────────────

export function Field({ label, value, onChange, placeholder, textarea, type }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; textarea?: boolean; type?: string;
}) {
  const cls = "w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]";
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-400">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls + " resize-y"} />
      ) : (
        <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}

// ─── Conditioning Format Preview ────────────────────────────────────

const FORMAT_PREVIEWS: Record<ConditioningFormat, { icon: string; label: string; fields: string; desc: string }> = {
  AMRAP:     { icon: "⏱️", label: "AMRAP",     fields: "Duration + Movements", desc: "As Many Rounds As Possible in a fixed time" },
  EMOM:     { icon: "🔄", label: "EMOM",      fields: "Duration + Interval + Movements", desc: "Every Minute On the Minute" },
  FOR_TIME: { icon: "✅", label: "FOR TIME",  fields: "Time Cap + Movements", desc: "Complete all work as fast as possible" },
  RFT:      { icon: "🔁", label: "RFT",       fields: "Rounds + Movements", desc: "Rounds For Time" },
  TABATA:   { icon: "⚡", label: "TABATA",    fields: "Work/Rest/Secs + Rounds + Movements", desc: "20s work / 10s rest protocol" },
  CHIPPER:  { icon: "📋", label: "CHIPPER",   fields: "Ordered movements (no sets)", desc: "One round of everything, in order" },
};

export function FormatSelector({ value, onChange }: {
  value: ConditioningFormat | null;
  onChange: (f: ConditioningFormat) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {(Object.keys(FORMAT_PREVIEWS) as ConditioningFormat[]).map((fmt) => {
        const p = FORMAT_PREVIEWS[fmt];
        const selected = value === fmt;
        return (
          <button key={fmt} type="button" onClick={() => onChange(fmt)}
            className={`rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
              selected
                ? "border-[#B4E3BD] bg-[#B4E3BD]/10 ring-1 ring-[#B4E3BD]/30"
                : "border-gray-800 bg-gray-950/60 hover:border-[#B4E3BD]/60 hover:bg-gray-900"
            }`}>
            <span className="block text-lg">{p.icon}</span>
            <span className={`mt-1 block text-sm font-bold ${selected ? "text-[#B4E3BD]" : "text-white"}`}>{p.label}</span>
            <span className="mt-0.5 block text-[10px] text-gray-500">{p.fields}</span>
            <span className="block text-[10px] text-gray-600">{p.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Confirmation Dialog ────────────────────────────────────────────

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="mx-4 w-full max-w-sm rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-lg font-bold text-white">{title}</p>
        <p className="mt-2 text-sm text-gray-400">{message}</p>
        <div className="mt-5 flex items-center justify-end gap-3">
          <button type="button" onClick={onCancel}
            className="rounded-full border border-gray-800 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-600">
            Cancel
          </button>
          <button type="button" onClick={onConfirm}
            className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}