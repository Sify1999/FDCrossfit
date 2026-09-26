"use client";

import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
import { useBodyScrollLock } from "./useScrollLock";

function IconX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconAthlete() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const ALL_EVENTS = [1, 2, 3, 4] as const;
const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

const EVENT_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: "bg-rose-500/15", border: "border-rose-500/40", text: "text-rose-400" },
  2: { bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-400" },
  3: { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-400" },
  4: { bg: "bg-violet-500/15", border: "border-violet-500/40", text: "text-violet-400" },
};

const LEVEL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Beginner: { bg: "bg-[#B4E3BD]/15", border: "border-[#B4E3BD]/40", text: "text-[#B4E3BD]" },
  Intermediate: { bg: "bg-orange-500/15", border: "border-orange-500/40", text: "text-orange-400" },
  Advanced: { bg: "bg-cyan-500/15", border: "border-cyan-500/40", text: "text-cyan-400" },
};

export default function AddAthleteModal({ open, onClose, onSaved }: Props) {
  useBodyScrollLock(open);

  const [name, setName] = useState("");
  const [level, setLevel] = useState<string>("Beginner");
  const [selectedEvents, setSelectedEvents] = useState<number[]>([1]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function toggleEvent(ev: number) {
    setSelectedEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev].sort()
    );
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Athlete name is required.");
      return;
    }
    if (selectedEvents.length === 0) {
      setError("Select at least one event.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.post("/competition-athletes/bulk", {
        name: trimmed,
        level,
        events: selectedEvents,
      });
      onSaved();
      onClose();
      setName("");
      setLevel("Beginner");
      setSelectedEvents([1]);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add athlete. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-b from-[#0d0d0d] to-[#111111] shadow-2xl shadow-black/60">
        {/* Top accent bar */}
        <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-[#B4E3BD]/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B4E3BD]/10 text-[#B4E3BD]">
              <IconAthlete />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Add Athlete</h2>
              <p className="mt-0.5 text-xs text-gray-500">Register a new athlete for the competition</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-800 hover:text-white">
            <IconX />
          </button>
        </div>

        <div className="space-y-5 px-6 pb-6">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Athlete Name
              </span>
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" autoFocus
              className="w-full rounded-xl border border-gray-800 bg-[#141414] px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD] focus:bg-gray-900 focus:ring-1 focus:ring-[#B4E3BD]/20"
            />
          </div>

          {/* Level — bright option buttons */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M10 22V8h4v14"/></svg>
                Level
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((lvl) => {
                const colors = LEVEL_COLORS[lvl];
                const isActive = level === lvl;
                return (
                  <button key={lvl} type="button" onClick={() => setLevel(lvl)}
                    className={`relative overflow-hidden rounded-xl border px-3 py-3 text-center text-sm font-semibold transition-all ${
                      isActive
                        ? `${colors.border} ${colors.bg} ${colors.text} shadow-sm`
                        : "border-gray-800 bg-[#141414] text-gray-400 hover:border-gray-600 hover:text-gray-200"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-50" />
                    )}
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Events — multi-select with scoreboard-like bright chips */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Events <span className="text-gray-600">(select one or more)</span>
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ALL_EVENTS.map((ev) => {
                const isSelected = selectedEvents.includes(ev);
                const colors = EVENT_COLORS[ev];
                return (
                  <button key={ev} type="button" onClick={() => toggleEvent(ev)}
                    className={`relative overflow-hidden rounded-xl border px-3 py-3 text-center text-sm font-bold transition-all duration-200 ${
                      isSelected
                        ? `${colors.border} ${colors.bg} ${colors.text} shadow-sm`
                        : "border-gray-800 bg-[#141414] text-gray-500 hover:border-gray-600 hover:text-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <span className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent`} />
                    )}
                    <span className="relative inline-flex items-center justify-center gap-1">
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      )}
                      Ev {ev}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Selected event chips */}
            {selectedEvents.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedEvents.map((ev) => {
                  const colors = EVENT_COLORS[ev];
                  return (
                    <span key={ev} className={`inline-flex items-center gap-1 rounded-full ${colors.bg} ${colors.text} ${colors.border} border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                      Event {ev}
                      <button type="button" onClick={() => toggleEvent(ev)} className="hover:opacity-70">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info note */}
          <div className="rounded-xl border border-dashed border-gray-800 bg-gradient-to-r from-[#141414]/80 to-[#141414]/30 px-4 py-3 text-xs text-gray-500">
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Score starts empty — it can be added later per event after the athlete competes.
            </span>
          </div>

          {error && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-2.5 text-sm text-red-400">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-800 px-6 py-4">
          <button type="button" onClick={onClose}
            className="rounded-full border border-gray-800 px-5 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-600"
          >Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="rounded-full bg-[#B4E3BD] px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >{saving ? "Adding..." : "Add Athlete"}</button>
        </div>
      </div>
    </div>
  );
}
