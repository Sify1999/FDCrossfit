"use client";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { Movement } from "./types";
type Props = { value: Movement | null; onChange: (m: Movement) => void; excludeId?: number; placeholder?: string; };
export default function MovementPicker({ value, onChange, excludeId, placeholder = "Search movements..." }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setError(null);
    const timer = setTimeout(async () => {
      try { const data = await api.get<Movement[]>(`/movements?q=${encodeURIComponent(query.trim())}`); if (!cancelled) setResults(data); }
      catch (err) { if (!cancelled) setError(err instanceof ApiError ? err.message : "Search failed"); }
      finally { if (!cancelled) setLoading(false); }
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  async function handleCreate() {
    if (!query.trim()) return;
    setCreating(true); setError(null);
    try { const movement = await api.post<Movement>("/movements", { name: query.trim() }); onChange(movement); setQuery(movement.name); setShowDropdown(false); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Failed to create movement"); }
    finally { setCreating(false); }
  }
  const filteredResults = excludeId ? results.filter((m) => m.id !== excludeId) : results;
  const showCreate = query.trim().length > 0 && !loading && !filteredResults.some((m) => m.name.trim().toLowerCase() === query.trim().toLowerCase());
  return (
    <div className="relative">
      {value && value.id ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#B4E3BD]/40 bg-gray-950 px-3 py-2.5">
          <span className="flex-1 text-sm font-semibold text-white">{value.name}</span>
          <button type="button" onClick={() => { onChange({} as Movement); setQuery(""); setShowDropdown(true); inputRef.current?.focus(); }}
            className="rounded-full border border-gray-800 px-2.5 py-1 text-[11px] text-gray-400 transition hover:border-red-400 hover:text-red-400">Change</button>
        </div>
      ) : (
        <input ref={inputRef} type="text" value={query} onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)} placeholder={placeholder}
          className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]" />
      )}
      {showDropdown && (!value || !value.id) && (
        <div ref={dropdownRef} className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 shadow-xl">
          {loading && <p className="px-3 py-4 text-center text-xs text-gray-500">Searching...</p>}
          {!loading && error && <p className="px-3 py-4 text-center text-xs text-red-400">{error}</p>}
          {!loading && !error && !filteredResults.length && !showCreate && <p className="px-3 py-4 text-center text-xs text-gray-500">{query.trim() ? "No movements found" : "Type to search"}</p>}
          {!loading && filteredResults.map((m) => (
            <button key={m.id} type="button" onClick={() => { onChange(m); setQuery(m.name); setShowDropdown(false); }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-white transition hover:bg-gray-800">
              <span className="flex-1 font-medium">{m.name}</span>
              <span className="text-[10px] uppercase text-gray-600">{m.default_unit}</span>
            </button>
          ))}
          {showCreate && (
            <button type="button" onClick={handleCreate} disabled={creating}
              className="flex w-full items-center gap-2 border-t border-gray-800 px-3 py-3 text-left text-sm text-[#B4E3BD] transition hover:bg-gray-800 disabled:opacity-50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
              {creating ? "Creating..." : `Create "${query.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}