"use client";

import { useBodyScrollLock } from "./useScrollLock";
import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";

type LogMovementEntry = {
  movement_name: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
  /** For EMOM: reps per round (index 0 = round 1) */
  repsPerRound?: string[];
  /** For EMOM: weight per round (index 0 = round 1) */
  weightPerRound?: string[];
};

type LogSectionEntry = {
  section_id: string;
  section_label: string;
  score: string;
  movements: LogMovementEntry[];
  rpe?: string;
  effort?: string;
  zone?: string;
  /** Per-section note */
  note?: string;
  /** Section format (e.g. "EMOM") — saved with log data for backwards-compat detection */
  format?: string;
  /** Number of rounds (for EMOM) */
  rounds?: number;
  /** Ranking direction for leaderboard ("Higher" | "Lower") */
  ranking_direction?: string;
};

type WorkoutLogEntry = {
  user_id: number;
  log_data: LogSectionEntry[];
  updated_at: string;
};

type AthleteInfo = {
  id: number;
  username: string;
  full_name: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  workoutDate: string;
};

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleString(); }
  catch { return iso; }
}

export default function WorkoutLogsViewer({ open, onClose, workoutDate }: Props) {
  useBodyScrollLock(open);
  const [logs, setLogs] = useState<WorkoutLogEntry[]>([]);
  const [athletes, setAthletes] = useState<AthleteInfo[]>([]);
  const [sectionMeta, setSectionMeta] = useState<Record<string, { format?: string; rounds?: number }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  // Track which round is selected in the detail view (per section_id)
  const [viewingRound, setViewingRound] = useState<Record<string, number>>({});

  // Reset viewing rounds when switching athletes
  function handleSelectAthlete(userId: number) {
    setViewingRound({});
    setSelectedUserId(userId);
  }

  useEffect(() => {
    if (!open) return;
    setSelectedUserId(null);
    setError(null);
    setLoading(true);
    async function load() {
      try {
        const [logsData, usersData, workoutData] = await Promise.all([
          api.get<WorkoutLogEntry[]>(`/workouts/${workoutDate}/logs`),
          api.get<AthleteInfo[]>(`/users`),
          api.get<{ sections: any[] }>(`/workouts/${workoutDate}`).catch(() => null),
        ]);
        setLogs(logsData);
        setAthletes(usersData);
        // Build a map of section_id -> { format, rounds } from the workout sections
        if (workoutData?.sections) {
          const map: Record<string, { format?: string; rounds?: number }> = {};
          for (const sec of workoutData.sections) {
            if (sec.id && sec.format === "EMOM") {
              map[sec.id] = { format: sec.format, rounds: sec.rounds ?? 0 };
            }
          }
          setSectionMeta(map);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load workout logs");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [open, workoutDate]);

  function athleteName(userId: number): string {
    const a = athletes.find((u) => u.id === userId);
    return a?.full_name || a?.username || `User #${userId}`;
  }

  const selectedLog = selectedUserId ? logs.find((l) => l.user_id === selectedUserId) : null;
  const selectedAthlete = selectedUserId ? athletes.find((u) => u.id === selectedUserId) : null;
  // Fallback for coaches/admins who logged their own workout
  const detailAthlete = selectedAthlete || (selectedUserId
    ? { id: selectedUserId, username: `user_${selectedUserId}`, full_name: null }
    : null);
  const detailName = detailAthlete?.full_name || detailAthlete?.username || `User #${selectedUserId}`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#B4E3BD]/20 bg-gray-900" onClick={(e) => e.stopPropagation()}>
        {detailAthlete && selectedLog ? (
          <>
            <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
              <div>
                <p className="text-[11px] uppercase tracking-[.25em] text-[#B4E3BD]">Workout Log</p>
                <h2 className="mt-1 text-lg font-bold text-white">
                  {detailName}
                </h2>
                <p className="text-xs text-gray-500">
                  {detailAthlete.username !== `user_${detailAthlete.id}`
                    ? `@${detailAthlete.username}`
                    : ""}{detailAthlete.username !== `user_${detailAthlete.id}` ? " · " : ""}Logged {formatDate(selectedLog.updated_at)}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedUserId(null)}
                className="rounded-full border border-gray-800 px-4 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-gray-600">Back</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {selectedLog.log_data.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No data logged yet.</p>}
              {selectedLog.log_data.map((section) => {
                // Detect EMOM: check workout section meta first (most reliable),
                // then saved format field, then repsPerRound fallback
                const workoutSec = sectionMeta[section.section_id];
                const isEmom = !!workoutSec || section.format === "EMOM" || section.movements.some((mov) => mov.repsPerRound && mov.repsPerRound.length > 0);
                const roundCount = isEmom
                  ? (workoutSec?.rounds ?? section.rounds ?? Math.max(...section.movements.map((mov) => mov.repsPerRound?.length ?? 0), 0))
                  : 0;
                return (
                <div key={section.section_id} className="rounded-2xl border border-gray-800 bg-gray-950/40 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#B4E3BD]">{section.section_label}</p>
                      {/* ── RPE / Effort / Zone inline ── */}
                      {(section.rpe || section.effort || section.zone) && (
                        <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-gray-500">
                          {section.rpe && <span className="rounded-md border border-gray-800/60 bg-gray-950/60 px-2 py-0.5">RPE: {section.rpe}</span>}
                          {section.effort && <span className="rounded-md border border-gray-800/60 bg-gray-950/60 px-2 py-0.5">Effort: {section.effort}</span>}
                          {section.zone && <span className="rounded-md border border-gray-800/60 bg-gray-950/60 px-2 py-0.5">Zone: {section.zone}</span>}
                        </div>
                      )}
                    </div>
                    {section.score && (
                      <span className="shrink-0 rounded-full border border-[#B4E3BD]/30 bg-[#B4E3BD]/10 px-3 py-1 text-xs font-bold text-[#B4E3BD] shadow-sm shadow-[#B4E3BD]/5">
                        Score: {section.score}{section.ranking_direction === "Higher" ? " ↑" : section.ranking_direction === "Lower" ? " ↓" : ""}
                      </span>
                    )}
                  </div>

                  {/* ── AMRAP instruction ─────────────────────────────────────────── */}
                  {(workoutSec?.format === "AMRAP" || section.format === "AMRAP") && (
                    <div className="mb-3 rounded-lg border border-[#B4E3BD]/10 bg-[#B4E3BD]/5 px-3 py-2">
                      <p className="text-[10px] text-gray-500 italic">Reps for the last round</p>
                    </div>
                  )}

                  {section.movements.length === 0 && <p className="text-xs text-gray-600">&mdash;</p>}

                  {/* ── EMOM round indicator badges ──────────────────────────── */}
                  {isEmom && roundCount > 0 && (
                    <div className="mb-3">
                      <span className="mb-1.5 block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Rounds</span>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: roundCount }, (_, ri) => {
                          const cur = viewingRound[section.section_id] ?? 0;
                          const isActive = ri === cur;
                          return (
                          <button
                            key={ri}
                            type="button"
                            onClick={() => setViewingRound((prev) => ({ ...prev, [section.section_id]: ri }))}
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                              isActive
                                ? "bg-[#B4E3BD] text-black shadow-sm shadow-[#B4E3BD]/30 scale-110"
                                : "border border-gray-700 bg-gray-950 text-gray-400 hover:border-[#B4E3BD]/60 hover:text-[#B4E3BD]"
                            }`}
                          >
                            {ri + 1}
                          </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {section.movements.map((mov, i) => (
                      <div key={i} className="rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-3 transition hover:border-gray-700">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-white">{mov.movement_name}</span>
                          {(mov.sets || mov.reps || mov.weight) && !isEmom && (
                            <span className="text-[11px] text-gray-400">
                              {mov.sets ? `${mov.sets} sets` : ""}
                              {mov.sets && mov.reps ? " × " : ""}
                              {mov.reps ? `${mov.reps} reps` : ""}
                              {(mov.sets || mov.reps) && mov.weight ? ", " : ""}
                              {mov.weight ? `@ ${mov.weight}` : ""}
                            </span>
                          )}
                        </div>
                        {/* ── EMOM: show reps for the selected round only ─────── */}
                        {isEmom && mov.repsPerRound && mov.repsPerRound.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#B4E3BD]/15 text-[9px] font-bold text-[#B4E3BD]">
                                {(viewingRound[section.section_id] ?? 0) + 1}
                              </span>
                              <span className="font-semibold text-gray-200">{mov.repsPerRound[viewingRound[section.section_id] ?? 0] || "—"} reps</span>
                            </div>
                            {mov.weightPerRound ? (
                              <span className="text-gray-500">@ {mov.weightPerRound[viewingRound[section.section_id] ?? 0] || "—"}</span>
                            ) : mov.weight ? (
                              <span className="text-gray-500">@ {mov.weight}</span>
                            ) : null}
                          </div>
                        )}
                        {/* ── EMOM without per-round data: show shared reps/weight ── */}
                        {isEmom && (!mov.repsPerRound || mov.repsPerRound.length === 0) && (
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {mov.reps && <span className="rounded-md bg-gray-800/80 px-2 py-0.5 text-gray-400">{mov.reps} reps</span>}
                            {mov.weight && <span className="rounded-md bg-gray-800/80 px-2 py-0.5 text-gray-400">@{mov.weight}</span>}
                          </div>
                        )}
                        {/* ── Non-EMOM: show sets/reps as chips ──────── */}
                        {!isEmom && (mov.sets || mov.reps || mov.weight) && (
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {mov.sets && <span className="rounded-md bg-gray-800/80 px-2 py-0.5 text-gray-400">{mov.sets} sets</span>}
                            {mov.reps && <span className="rounded-md bg-gray-800/80 px-2 py-0.5 text-gray-400">{mov.reps} reps</span>}
                            {mov.weight && <span className="rounded-md bg-gray-800/80 px-2 py-0.5 text-gray-400">@{mov.weight}</span>}
                          </div>
                        )}
                        {mov.notes && (
                          <p className="mt-2 text-xs italic text-gray-500 border-t border-gray-800 pt-2">&ldquo;{mov.notes}&rdquo;</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ── Per-section note ─────────────────────────────────────── */}
                  {section.note && (
                    <div className="mt-3 rounded-lg border border-gray-800/60 bg-gray-950/30 px-3 py-2">
                      <p className="mb-0.5 text-[10px] text-gray-600 uppercase tracking-wider">Note</p>
                      <p className="text-xs italic text-gray-400 leading-relaxed">{section.note}</p>
                    </div>
                  )}
                </div>
              );})}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-gray-800 px-5 py-5">
              <div>
                <p className="text-[11px] uppercase tracking-[.25em] text-[#B4E3BD]">Coach Tools</p>
                <h2 className="mt-1 text-xl font-bold text-white">Workout Logs</h2>
              </div>
              <button type="button" onClick={onClose} aria-label="Close"
                className="rounded-full border border-gray-800 p-2 text-gray-400 transition hover:border-[#B4E3BD] hover:text-[#B4E3BD]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {loading && <p className="py-8 text-center text-sm text-gray-500">Loading logs...</p>}
              {!loading && error && <p className="py-8 text-center text-sm text-red-400">{error}</p>}
              {!loading && !error && logs.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No athletes have logged this workout yet.</p>}
              {!loading && !error && logs.length > 0 && (
                <div className="space-y-2">
                  {logs.map((log) => {
                    // Collect non-empty scores for quick preview
                    const scorePreview = log.log_data
                      .filter((sec) => sec.score && sec.score.trim())
                      .map((sec) => (sec.score.trim()));
                    const hasScores = scorePreview.length > 0;
                    return (
                    <button key={log.user_id} onClick={() => handleSelectAthlete(log.user_id)}
                      className="flex w-full items-center gap-4 rounded-2xl border border-gray-800 bg-gray-950/60 px-5 py-4 text-left transition hover:border-[#B4E3BD]/60 hover:bg-gray-900 active:scale-[0.99] group">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#B4E3BD]/15 text-sm font-bold text-[#B4E3BD] ring-1 ring-[#B4E3BD]/20">{initials(athleteName(log.user_id))}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white group-hover:text-[#B4E3BD] transition-colors">{athleteName(log.user_id)}</span>
                        {hasScores ? (
                          <span className="mt-0.5 flex flex-wrap gap-1.5">
                            {scorePreview.map((s, i) => (
                              <span key={i} className="inline-flex items-center gap-1 rounded-md border border-[#B4E3BD]/20 bg-[#B4E3BD]/5 px-2 py-0.5 text-[11px] font-semibold text-[#B4E3BD]/90">
                                {log.log_data[i]?.section_label && <span className="text-[9px] uppercase tracking-wider text-[#B4E3BD]/60">{log.log_data[i].section_label}:</span>}
                                Score: {s}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="block truncate text-xs text-gray-600">{formatDate(log.updated_at)}</span>
                        )}
                      </span>
                      <span className="rounded-full border border-gray-800 p-2 text-gray-600 transition-colors group-hover:border-[#B4E3BD]/40 group-hover:text-[#B4E3BD]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}