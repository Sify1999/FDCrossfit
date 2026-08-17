"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import RecordsEditor from "./RecordsEditor";

type Athlete = {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: "member" | "coach" | "admin";
};

type Props = {
  open: boolean;
  onClose: () => void;
};

function initials(athlete: Athlete) {
  const source = (athlete.full_name?.trim() || athlete.username).trim();
  return source.slice(0, 2).toUpperCase();
}

export default function AthleteRosterModal({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Athlete | null>(null);

  // Fresh state every time the modal reopens.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelected(null);
  }, [open]);

  // Debounced search — refetches 300ms after typing stops, so every
  // keystroke doesn't fire its own request.
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      api
        .get<Athlete[]>(`/users${params}`)
        .then((res) => {
          if (cancelled) return;
          setAthletes(res);
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err instanceof ApiError ? err.message : "Failed to load athletes");
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      {selected ? (
        <RecordsEditor
          getUrl={`/athlete-records/${selected.id}`}
          putUrl={`/athlete-records/${selected.id}`}
          eyebrow={`@${selected.username}`}
          title={selected.full_name || selected.username}
          subtitle="Editing this athlete's personal bests. Weight is measured in kilograms."
          onDone={() => setSelected(null)}
          doneLabel="← Back to list"
        />
      ) : (
        <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[#B4E3BD]/20 bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 px-5 py-5">
            <div>
              <p className="text-[11px] uppercase tracking-[.25em] text-[#B4E3BD]">
                Coach Tools
              </p>
              <h2 className="mt-1 text-xl font-bold">Athletes</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-full border border-gray-800 p-2 text-gray-400 transition hover:border-[#B4E3BD] hover:text-[#B4E3BD]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Search — sticky so it stays reachable while the list scrolls */}
          <div className="border-b border-gray-800 px-5 py-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, username, or email"
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 transition focus:border-[#B4E3BD]"
            />
          </div>

          {/* List */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 coach-scroll">
            {loading && (
              <p className="py-8 text-center text-sm text-gray-500">Loading athletes...</p>
            )}

            {!loading && error && (
              <p className="py-8 text-center text-sm text-red-400">{error}</p>
            )}

            {!loading && !error && athletes.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">
                {query.trim() ? "No athletes match your search." : "No athletes yet."}
              </p>
            )}

            <div className="space-y-2">
              {!loading &&
                !error &&
                athletes.map((athlete) => (
                  <button
                    key={athlete.id}
                    onClick={() => setSelected(athlete)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-gray-800 bg-gray-950/60 px-4 py-3.5 text-left transition hover:border-[#B4E3BD]/60 hover:bg-gray-900 active:scale-[0.99]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#B4E3BD]/15 text-sm font-bold text-[#B4E3BD]">
                      {initials(athlete)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">
                        {athlete.full_name || athlete.username}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        @{athlete.username}
                        {athlete.email ? ` · ${athlete.email}` : ""}
                      </span>
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="shrink-0 text-gray-600"
                    >
                      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}