"use client";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { Movement } from "./types";

type Props = {
  value: Movement | null;
  onChange: (m: Movement) => void;
  /** Movement IDs to exclude from results (e.g., already picked in sibling rows). */
  excludeIds?: number[];
  placeholder?: string;
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="h-3.5 flex-1 rounded bg-gray-800 animate-pulse" />
      <div className="h-3 w-10 rounded bg-gray-800 animate-pulse" />
    </div>
  );
}

export default function MovementPicker({ value, onChange, excludeIds, placeholder = "Search movements..." }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [creating, setCreating] = useState(false);
  const [suggestions, setSuggestions] = useState<Movement[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [hasFetchedSuggestions, setHasFetchedSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Search when query changes ──────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setError(null);
    const timer = setTimeout(async () => {
      try {
        const data = await api.get<Movement[]>(`/movements?q=${encodeURIComponent(query.trim())}`);
        if (!cancelled) setResults(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Search failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  // ── Fetch suggestions when input is focused and empty ─────────────
  useEffect(() => {
    if (!showDropdown || query.trim() || hasFetchedSuggestions) return;
    let cancelled = false;
    setSuggestionsLoading(true);
    api.get<Movement[]>("/movements")
      .then((data) => { if (!cancelled) setSuggestions(data); })
      .catch(() => { /* silently fail — suggestions are a nice-to-have */ })
      .finally(() => { if (!cancelled) setSuggestionsLoading(false); });
    setHasFetchedSuggestions(true);
    return () => { cancelled = true; };
  }, [showDropdown, query, hasFetchedSuggestions]);
  // ── Close dropdown on outside click ────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Create-on-the-fly ──────────────────────────────────────────────
  async function handleCreate() {
    if (!query.trim()) return;
    setCreating(true); setError(null);
    try {
      const movement = await api.post<Movement>("/movements", { name: query.trim() });
      onChange(movement);
      setQuery(movement.name);
      setShowDropdown(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create movement");
    } finally {
      setCreating(false);
    }
  }

  // ── Filter helpers ─────────────────────────────────────────────────
  const filteredResults = excludeIds && excludeIds.length > 0
    ? results.filter((m) => !excludeIds.includes(m.id))
    : results;

  const filteredSuggestions = excludeIds && excludeIds.length > 0
    ? suggestions.filter((m) => !excludeIds.includes(m.id))
    : suggestions;

  const showCreate = query.trim().length > 0 && !loading && !filteredResults.some(
    (m) => m.name.trim().toLowerCase() === query.trim().toLowerCase()
  );

  const isActive = value && value.id;
  return (
    <div className="relative">
      {/* ── Selected state pill ────────────────────────────────────── */}
      {isActive ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#B4E3BD]/40 bg-gray-950 px-3 py-2.5">
          <span className="flex-1 text-sm font-semibold text-white">{value.name}</span>
          <button type="button" onClick={() => {
            onChange({} as Movement);
            setQuery("");
            setShowDropdown(true);
            setHasFetchedSuggestions(false);
            inputRef.current?.focus();
          }}
            className="rounded-full border border-gray-800 px-2.5 py-1 text-[11px] text-gray-400 transition hover:border-red-400 hover:text-red-400"
          >Change</button>
        </div>
      ) : (
        <input ref={inputRef} type="text" value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => { setShowDropdown(true); }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]"
        />
      )}

      {/* ── Dropdown ──────────────────────────────────────────────── */}
      {showDropdown && !isActive && (
        <div ref={dropdownRef}
          className="absolute start-0 end-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 shadow-xl"
        >
          {/* ── Search results section ─────────────────────────────── */}
          {query.trim() && loading && (
            <div className="px-3 py-4">
              {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
            </div>
          )}
          {!loading && error && (
            <p className="px-3 py-4 text-center text-xs text-red-400">{error}</p>
          )}
          {!loading && query.trim() && filteredResults.length > 0 && (
            <>
              {filteredResults.map((m) => (
                <button key={m.id} type="button"
                  onClick={() => { onChange(m); setQuery(m.name); setShowDropdown(false); }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-start text-sm text-white transition hover:bg-gray-800"
                >
                  <span className="flex-1 font-medium">{m.name}</span>
                  <span className="text-[10px] uppercase text-gray-600">{m.default_unit}</span>
                </button>
              ))}
            </>
          )}
          {!loading && !error && query.trim() && filteredResults.length === 0 && !showCreate && (
            <p className="px-3 py-4 text-center text-xs text-gray-500">No movements found</p>
          )}

          {/* ── "Create" option ────────────────────────────────────── */}
          {showCreate && (
            <button type="button" onClick={handleCreate} disabled={creating}
              className="flex w-full items-center gap-2 border-t border-gray-800 px-3 py-3 text-start text-sm text-[#B4E3BD] transition hover:bg-gray-800 disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              {creating ? "Creating..." : `Create "${query.trim()}"`}
            </button>
          )}

          {/* ── Suggestions / recently used ────────────────────────── */}
          {!query.trim() && suggestionsLoading && (
            <div className="px-3 py-4">
              {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
            </div>
          )}
          {!query.trim() && !suggestionsLoading && filteredSuggestions.length > 0 && (
            <>
              <div className="flex items-center gap-2 border-b border-gray-800 px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">All movements</span>
                <div className="h-px flex-1 bg-gray-800" />
              </div>
              {filteredSuggestions.map((m) => (
                <button key={m.id} type="button"
                  onClick={() => { onChange(m); setQuery(m.name); setShowDropdown(false); }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-start text-sm text-gray-400 transition hover:bg-gray-800"
                >
                  <span className="flex-1 font-medium">{m.name}</span>
                  <span className="text-[10px] uppercase text-gray-700">{m.default_unit}</span>
                </button>
              ))}
            </>
          )}
          {!query.trim() && !suggestionsLoading && filteredSuggestions.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-gray-500">Type to search movements</p>
          )}
        </div>
      )}
    </div>
  );
}