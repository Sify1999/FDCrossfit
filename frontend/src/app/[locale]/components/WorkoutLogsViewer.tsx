"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";

type LogMovementEntry = {
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
  movements: LogMovementEntry[];
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
  const [logs, setLogs] = useState<WorkoutLogEntry[]>([]);
  const [athletes, setAthletes] = useState<AthleteInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedUserId(null);
    setError(null);
    setLoading(true);
    async function load() {
      try {
        const [logsData, usersData] = await Promise.all([
          api.get<WorkoutLogEntry[]>(`/workouts/${workoutDate}/logs`),
          api.get<AthleteInfo[]>(`/users`),
        ]);
        setLogs(logsData);
        setAthletes(usersData);
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
                className="rounded-full border border-gray-800 px-4 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-gray-600">&larr; Back</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {selectedLog.log_data.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No data logged yet.</p>}
              {selectedLog.log_data.map((section) => (
                <div key={section.section_id}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#B4E3BD]">{section.section_label}</p>
                    {section.score && (
                      <span className="rounded-full border border-[#B4E3BD]/30 bg-[#B4E3BD]/10 px-2.5 py-0.5 text-xs font-bold text-[#B4E3BD]">
                        Score: {section.score}
                      </span>
                    )}
                  </div>
                  {section.movements.length === 0 && <p className="text-xs text-gray-600">&mdash;</p>}
                  <div className="space-y-2">
                    {section.movements.map((mov, i) => (
                      <div key={i} className="rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="min-w-[120px] text-sm font-medium text-white">{mov.movement_name}</span>
                          <span className="text-xs text-gray-400">
                            {mov.sets ? `${mov.sets} sets` : ""}
                            {mov.sets && mov.reps ? " × " : ""}
                            {mov.reps ? `${mov.reps} reps` : ""}
                            {(mov.sets || mov.reps) && mov.weight ? ", " : ""}
                            {mov.weight ? `@ ${mov.weight}` : ""}
                          </span>
                        </div>
                        {mov.notes && <p className="mt-2 text-xs italic text-gray-500 border-t border-gray-800 pt-2">&ldquo;{mov.notes}&rdquo;</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
                  {logs.map((log) => (
                    <button key={log.user_id} onClick={() => setSelectedUserId(log.user_id)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-gray-800 bg-gray-950/60 px-4 py-3.5 text-left transition hover:border-[#B4E3BD]/60 hover:bg-gray-900 active:scale-[0.99]">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#B4E3BD]/15 text-sm font-bold text-[#B4E3BD]">{initials(athleteName(log.user_id))}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">{athleteName(log.user_id)}</span>
                        <span className="block truncate text-xs text-gray-500">{formatDate(log.updated_at)}</span>
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gray-600">
                        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}