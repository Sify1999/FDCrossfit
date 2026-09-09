"use client";

import { useState, useEffect } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
import { fetchCurrentUser, type CurrentUser } from "@/lib/auth";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type LogMovementItem = {
  movement_name: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
};

type LogSectionEntry = {
  section_id: string;
  section_label: string;
  score: string;
  movements: LogMovementItem[];
};

type LogData = LogSectionEntry[];

type Props = {
  open: boolean;
  onClose: () => void;
  workoutDate: string;
  sections: SectionForLog[];
};

export type SectionForLog = {
  id: string;
  label: string;
  movementNames: string[];
  scoreType: string;
  format: string;
  rounds?: number;
  timeCapMinutes?: number;
};
export default function LogWorkoutModal({ open, onClose, workoutDate, sections }: Props) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [logData, setLogData] = useState<LogData>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchCurrentUser().then(setUser);
  }, [open]);

  useEffect(() => {
    if (!open || !workoutDate) return;
    let cancelled = false;

    async function loadExisting() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<{ log_data: LogData; updated_at: string }>(
          `/workouts/${workoutDate}/logs/mine`
        );
        if (!cancelled) {
          setLogData(data.log_data?.length ? mergeLogWithSections(data.log_data, sections) : buildEmptyLog(sections));
        }
      } catch (err) {
        if (!cancelled) {
          setLogData(buildEmptyLog(sections));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    setLogData(buildEmptyLog(sections));
    loadExisting();
    return () => { cancelled = true; };
  }, [open, workoutDate, sections]);

  function buildEmptyLog(sectionList: SectionForLog[]): LogData {
    return sectionList.map((sec) => ({
      section_id: sec.id,
      section_label: sec.label,
      score: "",
      movements: sec.movementNames.map((name) => ({
        movement_name: name, sets: "", reps: "", weight: "", notes: "",
      })),
    }));
  }

  function mergeLogWithSections(existing: LogData, sectionList: SectionForLog[]): LogData {
    return sectionList.map((sec) => {
      const existingSection = existing.find((e) => e.section_id === sec.id);
      return {
        section_id: sec.id,
        section_label: sec.label,
        score: existingSection?.score ?? "",
        movements: sec.movementNames.map((name) => {
          const existingMov = existingSection?.movements?.find((m) => m.movement_name === name);
          return existingMov
            ? { ...existingMov }
            : { movement_name: name, sets: "", reps: "", weight: "", notes: "" };
        }),
      };
    });
  }

  function updateSectionScore(sIdx: number, value: string) {
    setLogData((prev) => {
      const next = [...prev];
      next[sIdx] = { ...next[sIdx], score: value };
      return next;
    });
  }

  function updateMovement(sIdx: number, mIdx: number, field: keyof LogMovementItem, value: string) {
    setLogData((prev) => {
      const next = [...prev];
      const mov = { ...next[sIdx].movements[mIdx], [field]: value };
      next[sIdx] = {
        ...next[sIdx],
        movements: [...next[sIdx].movements.slice(0, mIdx), mov, ...next[sIdx].movements.slice(mIdx + 1)],
      };
      return next;
    });
  }

  async function handleSave() {
    if (!workoutDate) return;
    setSaving(true);
    setError(null);
    try {
      await api.put(`/workouts/${workoutDate}/logs/mine`, { log_data: logData });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save workout log"));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm pt-4 pb-12" onClick={onClose}>
      <div className="mx-4 w-full max-w-lg rounded-3xl border border-gray-800 bg-gray-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="text-lg font-bold text-white">Log Workout</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-gray-500 transition hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-5">
          {loading && <div className="py-8 text-center text-sm text-gray-500">Loading your previous log...</div>}
          {!loading && logData.length === 0 && <div className="py-8 text-center text-sm text-gray-500">No sections to log.</div>}
          {!loading && logData.map((section, sIdx) => {
            const secMeta = sections[sIdx];
            const isTimeScore = secMeta?.scoreType === "time";
            return (
            <div key={section.section_id}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#B4E3BD]">{section.section_label}</p>

              {/* ── Score input (only when score target is set) ──────────────── */}
              {secMeta?.scoreType && (
              <div className="mb-3 rounded-xl border border-[#B4E3BD]/20 bg-[#B4E3BD]/5 px-4 py-3">
                <span className="block text-[10px] text-gray-500 mb-1.5">
                  {isTimeScore
                    ? "Finish time"
                    : (secMeta?.format === "AMRAP" ? "Score — completed" : "Score")}{" "}
                  {secMeta?.scoreType && !isTimeScore ? `(${secMeta.scoreType})` : ""}
                </span>
                {isTimeScore && secMeta?.format === "RFT" && secMeta?.rounds && secMeta.rounds > 1 ? (
                  /* ── RFT: one time input per round ──────────────── */
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-600">Per round (min:sec)</p>
                    <div className="flex flex-wrap gap-3">
                      {Array.from({ length: secMeta.rounds }).map((_, rIdx) => {
                        const roundTimes = section.score.split(",");
                        const roundVal = roundTimes[rIdx] ?? "";
                        const parts = roundVal.split(":");
                        return (
                          <div key={rIdx} className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-600 w-4">{rIdx + 1}</span>
                            <input
                              type="text"
                              value={parts[0] ?? ""}
                              onChange={(e) => {
                                const times = section.score.split(",");
                                const curParts = (times[rIdx] ?? "").split(":");
                                times[rIdx] = `${e.target.value || ""}:${curParts[1] ?? ""}`;
                                updateSectionScore(sIdx, times.join(","));
                              }}
                              placeholder="0"
                              inputMode="numeric"
                              className="w-12 rounded-lg border border-gray-800 bg-gray-950 px-1.5 py-1.5 text-center text-xs text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]"
                            />
                            <span className="text-xs text-gray-500">:</span>
                            <input
                              type="text"
                              value={parts[1] ?? ""}
                              onChange={(e) => {
                                const times = section.score.split(",");
                                const curParts = (times[rIdx] ?? "").split(":");
                                times[rIdx] = `${curParts[0] ?? ""}:${e.target.value || ""}`;
                                updateSectionScore(sIdx, times.join(","));
                              }}
                              placeholder="00"
                              inputMode="numeric"
                              className="w-12 rounded-lg border border-gray-800 bg-gray-950 px-1.5 py-1.5 text-center text-xs text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : isTimeScore ? (
                  /* ── Single min:sec input — for FOR_TIME, CHIPPER, etc. ── */
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={(() => { const parts = section.score.split(":"); return parts[0] ?? ""; })()}
                      onChange={(e) => {
                        const parts = section.score.split(":");
                        const newScore = `${e.target.value || ""}:${parts[1] ?? ""}`;
                        updateSectionScore(sIdx, newScore);
                      }}
                      placeholder="min"
                      inputMode="numeric"
                      className="w-16 rounded-lg border border-gray-800 bg-gray-950 px-2 py-2 text-center text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]"
                    />
                    <span className="text-sm font-semibold text-gray-500">:</span>
                    <input
                      type="text"
                      value={(() => { const parts = section.score.split(":"); return parts[1] ?? ""; })()}
                      onChange={(e) => {
                        const parts = section.score.split(":");
                        const newScore = `${parts[0] ?? ""}:${e.target.value || ""}`;
                        updateSectionScore(sIdx, newScore);
                      }}
                      placeholder="sec"
                      inputMode="numeric"
                      className="w-16 rounded-lg border border-gray-800 bg-gray-950 px-2 py-2 text-center text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]"
                    />
                  </div>
                ) : (
                  /* ── Number input + unit label — for rounds, cal, meters etc. ── */
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={section.score}
                      onChange={(e) => updateSectionScore(sIdx, e.target.value)}
                      placeholder="0"
                      inputMode="numeric"
                      className="w-20 rounded-lg border border-gray-800 bg-gray-950 px-2 py-2 text-center text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]"
                    />
                    <span className="text-xs font-medium text-gray-500">
                      {secMeta?.scoreType || "score"}
                    </span>
                  </div>
                )}
              </div>
            )}
              {section.movements.length === 0 && <p className="text-xs text-gray-600">&mdash;</p>}
              <div className="space-y-2">
                {section.movements.map((mov, mIdx) => (
                  <div key={mIdx} className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                    <span className="block text-[10px] text-gray-600 mb-1.5">{mov.movement_name}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <div>
                        <span className="block text-[10px] text-gray-600">Sets</span>
                        <input type="text" value={mov.sets}
                          onChange={(e) => updateMovement(sIdx, mIdx, "sets", e.target.value)}
                          placeholder="&mdash;" className="w-12 rounded-lg border border-gray-800 bg-gray-950 px-2 py-1.5 text-center text-xs text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]" />
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-600">Reps</span>
                        <input type="text" value={mov.reps}
                          onChange={(e) => updateMovement(sIdx, mIdx, "reps", e.target.value)}
                          placeholder="&mdash;" className="w-12 rounded-lg border border-gray-800 bg-gray-950 px-2 py-1.5 text-center text-xs text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]" />
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-600">Weight</span>
                        <input type="text" value={mov.weight}
                          onChange={(e) => updateMovement(sIdx, mIdx, "weight", e.target.value)}
                          placeholder="&mdash;" className="w-16 rounded-lg border border-gray-800 bg-gray-950 px-2 py-1.5 text-center text-xs text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]" />
                      </div>
                    </div>
                    <textarea
                      value={mov.notes}
                      onChange={(e) => updateMovement(sIdx, mIdx, "notes", e.target.value)}
                      placeholder="e.g. Rx'd, scaled to 20kg, felt great..."
                      rows={1}
                      className="mt-2 w-full resize-none rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD] focus:bg-gray-900"
                    />
                  </div>
                ))}
              </div>
            </div>
          )})}
        </div>

        {error && <div className="mx-6 mb-2 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">{error}</div>}

        <div className="flex items-center justify-end gap-3 border-t border-gray-800 px-6 py-4">
          <button type="button" onClick={onClose}
            className="rounded-full border border-gray-800 px-5 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-600">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving || loading}
            className="rounded-full bg-[#B4E3BD] px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Saving..." : "Save log"}
          </button>
        </div>
      </div>
    </div>
  );
}