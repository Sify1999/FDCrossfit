"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api-client";

type RecordRow = {
  id: string;
  label: string;
  value: string;
  isCustom: boolean;
};

type ApiRecordItem = {
  id: string;
  label: string;
  value: string;
};

const DEFAULT_EXERCISES = [
  "Back Squat",
  "Front Squat",
  "Deadlift",
  "Bench Press",
  "Push Press",
  "Strict Press",
  "Power Clean",
  "Power Snatch",
  "Push Jerk",
];

function newRowId() {
  return Math.random().toString(36).slice(2, 9);
}

function cleanWeight(value: string) {
  return value.replace(/[^\d.]/g, "");
}

function buildRowsFromSaved(saved: ApiRecordItem[]): RecordRow[] {
  const map = new Map(saved.map((r) => [r.label.toLowerCase(), r]));

  const defaults = DEFAULT_EXERCISES.map((label) => {
    const item = map.get(label.toLowerCase());
    return {
      id: item?.id ?? newRowId(),
      label,
      value: item?.value ?? "",
      isCustom: false,
    };
  });

  const defaultNames = new Set(DEFAULT_EXERCISES.map((x) => x.toLowerCase()));

  const custom = saved
    .filter((x) => !defaultNames.has(x.label.toLowerCase()))
    .map((x) => ({ id: x.id, label: x.label, value: x.value, isCustom: true }));

  return [...defaults, ...custom];
}

type Props = {
  /** e.g. "/athlete-records/me" or "/athlete-records/42" */
  getUrl: string;
  putUrl: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Footer's secondary button — "go back to the list" for the coach
   * roster flow, or "close the modal" when this is the only screen. */
  onDone: () => void;
  doneLabel?: string;
};

export default function RecordsEditor({
  getUrl,
  putUrl,
  eyebrow,
  title,
  subtitle,
  onDone,
  doneLabel = "Cancel",
}: Props) {
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const newInputRef = useRef<HTMLInputElement | null>(null);

  // Re-fetch whenever the target URL changes — this is what lets a coach
  // switch from one athlete straight to another without unmounting.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setEditing(false);

    api
      .get<{ records: ApiRecordItem[] }>(getUrl)
      .then((res) => {
        if (cancelled) return;
        setRows(buildRowsFromSaved(res.records));
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : "Failed loading records");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [getUrl]);

  function updateLabel(id: string, label: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, label } : r)));
  }

  function updateWeight(id: string, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, value: cleanWeight(value) } : r)),
    );
  }

  function addExercise() {
    const id = newRowId();
    setRows((prev) => [...prev, { id, label: "", value: "", isCustom: true }]);
    setEditing(true);
    setTimeout(() => newInputRef.current?.focus(), 100);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function save() {
    setSaving(true);
    setSaveError(null);

    try {
      const payload = rows
        .filter((r) => r.label.trim())
        .map((r) => ({ id: r.id, label: r.label.trim(), value: r.value }));

      const res = await api.put<{ records: ApiRecordItem[] }>(putUrl, { records: payload });

      setRows(buildRowsFromSaved(res.records));
      setEditing(false);
      onDone();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed saving records");
    } finally {
      setSaving(false);
    }
  }

  const inputBase =
    "rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-sm text-white outline-none " +
    "placeholder:text-gray-600 focus:border-[#B4E3BD] transition";

  return (
    <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[#B4E3BD]/20 bg-gray-900">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-800 px-5 py-5">
        <div className="min-w-0">
          <p className="truncate text-[11px] uppercase tracking-[.25em] text-[#B4E3BD]">
            {eyebrow}
          </p>
          <h2 className="mt-1 truncate text-xl font-bold">{title}</h2>
        </div>

        <button
          onClick={() => setEditing((e) => !e)}
          className="shrink-0 rounded-full border border-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#B4E3BD] hover:text-[#B4E3BD]"
        >
          {editing ? "Done" : "Edit rows"}
        </button>
      </div>

      {/* BODY */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-5 coach-scroll">
        <div className="mb-4 rounded-2xl border border-gray-800 bg-gray-950/50 p-4">
          <p className="text-sm font-semibold">Personal bests</p>
          <p className="mt-1 text-xs text-gray-500">
            {subtitle ?? "Maximum lifts, measured in kilograms."}
          </p>
        </div>

        {loading && (
          <p className="py-8 text-center text-sm text-gray-500">Loading records...</p>
        )}

        {!loading && loadError && (
          <p className="py-8 text-center text-sm text-red-400">{loadError}</p>
        )}

        {!loading &&
          !loadError &&
          rows.map((row, index) => (
            <div
              key={row.id}
              className="mb-3 flex min-w-0 flex-col gap-3 rounded-2xl border border-gray-800 bg-gray-950/60 p-3 sm:flex-row sm:items-center"
            >
              {editing ? (
                <input
                  ref={row.label === "" && index === rows.length - 1 ? newInputRef : undefined}
                  value={row.label}
                  onChange={(e) => updateLabel(row.id, e.target.value)}
                  placeholder="Exercise name"
                  className={`${inputBase} flex-1 font-semibold`}
                />
              ) : (
                <span className="flex-1 truncate text-sm font-semibold">{row.label}</span>
              )}

              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={row.value}
                    onChange={(e) => updateWeight(row.id, e.target.value)}
                    placeholder="0"
                    className={`${inputBase} w-28 pr-8 text-center`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    kg
                  </span>
                </div>

                {editing && (
                  <button
                    onClick={() => removeRow(row.id)}
                    className="rounded-full border border-gray-800 px-3 py-2 text-gray-500 transition hover:border-red-400 hover:text-red-400"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}

        {!loading && !loadError && (
          <button
            onClick={addExercise}
            className="mt-2 w-full rounded-2xl border border-dashed border-gray-800 py-3 text-sm font-semibold text-gray-400 transition hover:border-[#B4E3BD]/50 hover:text-[#B4E3BD]"
          >
            + Add exercise
          </button>
        )}
      </div>

      {/* FOOTER */}
      <div className="border-t border-gray-800 px-5 py-4">
        {saveError && <p className="mb-3 text-sm text-red-400">{saveError}</p>}

        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={saving || loading}
            className="rounded-full bg-[#B4E3BD] px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            onClick={onDone}
            disabled={saving}
            className="rounded-full border border-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-gray-600"
          >
            {doneLabel}
          </button>
        </div>
      </div>
    </div>
  );
}