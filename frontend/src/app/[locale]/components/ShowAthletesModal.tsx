"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
import { useBodyScrollLock } from "./useScrollLock";
import { useLocale } from "next-intl";
import { eventLabel } from "@/lib/competition-events";

type AthleteEntry = {
  id: number;
  name: string;
  level: string;
  event: number;
  score: number | null;
  reps: number | null;
  weight: number | null;
  /** Raw performance time (total seconds) for time-based events — independent of `score`. */
  time_seconds?: number | null;
  score_2: number | null;
  reps_2: number | null;
  weight_2: number | null;
  time_seconds_2?: number | null;
  tiebreaker_type: string | null;
  tiebreaker_value: number | null;
  tiebreaker_value_2: number | null;
  heat: number | null;
  line: number | null;
  time_ms?: number | null;
  time_ms_2?: number | null;
  time_hundredths?: number | null;
  time_hundredths_2?: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onDataChanged: () => void;
  /** When true, the modal is a read-only view — no editing and no delete. */
  readOnly?: boolean;
  /** When set, the modal opens with this athlete's entries already expanded. */
  initialName?: string | null;
  /** When true, only the initial athlete's details are shown (no search / list). */
  hideList?: boolean;
  /** Called when the coach clicks "Edit athlete" with the athlete's current registration. */
  onEditAthlete?: (athlete: {
    name: string;
    level: string;
    events: { event: number; heat: number | null; line: number | null }[];
  }) => void;
};

const EVENT_COLORS: Record<number, { chip: string; dot: string; bg: string }> = {
  1: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
  2: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
  3: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
  4: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
  5: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
  6: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
  7: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
  8: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
  9: { chip: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", dot: "bg-[#B4E3BD]", bg: "hover:bg-[#B4E3BD]/5" },
};

const LEVEL_STYLES: Record<string, { badge: string; bg: string }> = {
  Beginner: { badge: "bg-[#B4E3BD]/20 text-[#B4E3BD] border-[#B4E3BD]/30", bg: "hover:bg-[#B4E3BD]/5" },
  Intermediate: { badge: "bg-[#f97316]/20 text-[#f97316] border-[#f97316]/30", bg: "hover:bg-[#f97316]/5" },
  Advanced: { badge: "bg-[#ec4899]/20 text-[#ec4899] border-[#ec4899]/30", bg: "hover:bg-[#ec4899]/5" },
};

// ─── Units ────────────────────────────────────────────────────────────

type Unit = "reps" | "weight" | "time";

const UNIT_META: Record<Unit, { label: string; hint: string; placeholder: string; short: string }> = {
  reps: { label: "Reps", hint: "Number of repetitions", placeholder: "Enter reps", short: "Reps" },
  weight: { label: "Weight", hint: "Load in kilograms", placeholder: "Enter weight (kg)", short: "Wt" },
  time: { label: "Time", hint: "Minutes : seconds", placeholder: "", short: "Time" },
};

const UNIT_ORDER: Unit[] = ["reps", "weight", "time"];

// ─── Draft helpers ────────────────────────────────────────────────────
// Everything the coach types is kept as a plain STRING and only converted
// to numbers on save — that's what keeps every input typeable.

type TimeDraft = { min: string; sec: string };

type PartDraft = {
  points: string;
  unit: Unit;
  num: string; // reps / weight value
  min: string; // time minutes
  sec: string; // time seconds
};

const emptyPart = (): PartDraft => ({ points: "", unit: "reps", num: "", min: "", sec: "" });
const emptyTime = (): TimeDraft => ({ min: "", sec: "" });

const numToStr = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));
const strToNum = (s: string): number | null => (s.trim() === "" ? null : parseInt(s, 10));
const pad2 = (s: string) => (s === "" ? "" : s.padStart(2, "0"));

function secondsToTimeDraft(total: number | null | undefined): TimeDraft {
  if (total === null || total === undefined) return emptyTime();
  return { min: String(Math.floor(total / 60)), sec: String(total % 60) };
}

function timeDraftToSeconds(t: TimeDraft): number | null {
  if (t.min.trim() === "" && t.sec.trim() === "") return null;
  return parseInt(t.min || "0", 10) * 60 + parseInt(t.sec || "0", 10);
}

/** Rebuild an editor draft from what is stored on the entry. */
function partFromStored(
  score: number | null,
  reps: number | null,
  weight: number | null,
  time_seconds: number | null | undefined,
): PartDraft {
  const base = { ...emptyPart(), points: numToStr(score) };
  if (reps !== null) return { ...base, unit: "reps", num: String(reps) };
  if (weight !== null) return { ...base, unit: "weight", num: String(weight) };
  if (time_seconds !== null && time_seconds !== undefined) {
    const t = secondsToTimeDraft(time_seconds);
    return { ...base, unit: "time", min: t.min, sec: t.sec };
  }
  return base;
}

/** Turn a draft into the stored fields.
    - Score → `score` (leaderboard points) for all units
    - Reps / Weight → `reps` / `weight` from the Result value
    - Time → `time_seconds` holds the raw performance (total seconds) */
function partToPayload(d: PartDraft) {
  return {
    score: strToNum(d.points),
    reps: d.unit === "reps" ? strToNum(d.num) : null,
    weight: d.unit === "weight" ? strToNum(d.num) : null,
    time_seconds: d.unit === "time" ? timeDraftToSeconds({ min: d.min, sec: d.sec }) : null,
  };
}

/** Convert total seconds → MM:SS (e.g. 330 → "05:30"). */
function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/** Format a stored tiebreaker value for display (time → MM:SS). */
function formatTiebreaker(type: string | null, value: number | null): string {
  if (value === null) return "—";
  if (type === "time" || type === null) return formatTime(value);
  return value.toLocaleString();
}

/** One-line result for the summary row, e.g. "Reps 12", "Wt 40 kg", "Time 05:30". */
function resultText(
  reps: number | null,
  weight: number | null,
  time_seconds: number | null | undefined,
): string {
  if (reps !== null) return `Reps ${reps}`;
  if (weight !== null) return `Wt ${weight} kg`;
  if (time_seconds !== null && time_seconds !== undefined) return `Time ${formatTime(time_seconds)}`;
  return "—";
}

// ─── Icons ────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconChevronDown({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// ─── Shared input styling ─────────────────────────────────────────────

const FIELD_LABEL = "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500";

const FIELD_INPUT =
  "w-full min-w-0 rounded-xl border border-gray-700 bg-gray-900 px-3 py-3 text-center text-sm font-bold tabular-nums text-white " +
  "outline-none transition placeholder:font-medium placeholder:text-gray-500 " +
  "focus:border-[#B4E3BD] focus:ring-1 focus:ring-[#B4E3BD]/20";

// ─── Unit dropdown (Reps / Weight / Time) ─────────────────────────────

function UnitDropdown({
  value,
  onChange,
}: {
  value: Unit;
  onChange: (u: Unit) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Result unit"
        className={`flex h-full min-h-[46px] items-center gap-2 rounded-xl border bg-gray-900 px-3 text-sm font-semibold transition ${
          open
            ? "border-[#B4E3BD] text-[#B4E3BD] ring-1 ring-[#B4E3BD]/20"
            : "border-gray-700 text-gray-200 hover:border-[#B4E3BD]/50"
        }`}
      >
        <span>{UNIT_META[value].label}</span>
        <IconChevronDown open={open} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute start-0 top-full z-50 mt-1.5 w-52 animate-[fadeIn_0.15s_ease-out] overflow-hidden rounded-xl border border-gray-700 bg-gray-900 p-1 shadow-xl shadow-black/60"
        >
          {UNIT_ORDER.map((u) => {
            const active = u === value;
            return (
              <button
                key={u}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  if (u !== value) onChange(u);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-start transition ${
                  active ? "bg-[#B4E3BD]/10" : "hover:bg-white/5"
                }`}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[#B4E3BD]">
                  {active && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  )}
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${active ? "text-[#B4E3BD]" : "text-white"}`}>
                    {UNIT_META[u].label}
                  </span>
                  <span className="block text-[11px] text-gray-500">{UNIT_META[u].hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Inputs ───────────────────────────────────────────────────────────

/** Digits-only numeric input. */
function NumInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  suffix,
  accent = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="relative" dir="ltr">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`${FIELD_INPUT} ${accent ? "text-base" : ""} ${suffix ? "pe-9" : ""}`}
      />
      {suffix && value !== "" && (
        <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-[10px] font-bold uppercase text-gray-500">
          {suffix}
        </span>
      )}
    </div>
  );
}

/** MM : SS — each box keeps its own text, so typing/deleting works normally. */
function TimeInput({
  value,
  onChange,
  ariaPrefix,
}: {
  value: TimeDraft;
  onChange: (v: TimeDraft) => void;
  ariaPrefix: string;
}) {
  const minRef = useRef<HTMLInputElement>(null);
  const secRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-1.5" dir="ltr">
      <input
        ref={minRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={2}
        value={value.min}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
          onChange({ ...value, min: digits });
          if (digits.length === 2) secRef.current?.focus();
        }}
        onBlur={() => {}}
        placeholder="MM"
        aria-label={`${ariaPrefix} minutes`}
        className={FIELD_INPUT}
      />
      <span className="shrink-0 select-none font-black text-gray-500">:</span>
      <input
        ref={secRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={2}
        value={value.sec}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          let digits = e.target.value.replace(/\D/g, "").slice(0, 2);
          if (digits !== "" && parseInt(digits, 10) > 59) digits = "59";
          onChange({ ...value, sec: digits });
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && value.sec === "") minRef.current?.focus();
        }}
        onBlur={() => {}}
        placeholder="SS"
        aria-label={`${ariaPrefix} seconds`}
        className={FIELD_INPUT}
      />
    </div>
  );
}

/** Tie breaker — unchanged behaviour: always MM : SS time. */
function TieBreakerField({
  label = "Tie Breaker",
  value,
  onChange,
}: {
  label?: string;
  value: TimeDraft;
  onChange: (v: TimeDraft) => void;
}) {
  return (
    <div>
      <span className={`${FIELD_LABEL} flex items-center gap-1.5`}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        {label}
      </span>
      <TimeInput value={value} onChange={onChange} ariaPrefix={label} />
    </div>
  );
}

/** Points + Result (unit dropdown + value) for one part of an event. */
function PartEditor({
  value,
  onChange,
  ariaPrefix,
}: {
  value: PartDraft;
  onChange: (v: PartDraft) => void;
  ariaPrefix: string;
}) {
  const meta = UNIT_META[value.unit];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      {/* Score */}
      <div className="min-w-0">
        <span className={FIELD_LABEL}>Score</span>
        <NumInput
          value={value.points}
          onChange={(v) => onChange({ ...value, points: v })}
          placeholder="Score"
          ariaLabel={`${ariaPrefix} score`}
          accent
        />
      </div>

      {/* Result — unit dropdown + value that follows the unit */}
      <div className="min-w-0">
        <span className={FIELD_LABEL}>Result</span>
        <div className="flex items-stretch gap-2">
          <UnitDropdown
            value={value.unit}
            // Switching unit starts clean so reps never turn into kilograms.
            onChange={(u) => onChange({ ...value, unit: u, num: "", min: "", sec: "" })}
          />
          <div className="min-w-0 flex-1">
            {value.unit === "time" ? (
              <TimeInput
                value={{ min: value.min, sec: value.sec }}
                onChange={(t) => onChange({ ...value, min: t.min, sec: t.sec })}
                ariaPrefix={`${ariaPrefix} result`}
              />
            ) : (
              <NumInput
                value={value.num}
                onChange={(v) => onChange({ ...value, num: v })}
                placeholder={meta.placeholder}
                ariaLabel={`${ariaPrefix} ${meta.label}`}
                suffix={value.unit === "weight" ? "kg" : undefined}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PartTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <span className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#B4E3BD]">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      {children}
      {hint && <span className="font-medium normal-case text-gray-500">- {hint}</span>}
    </span>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────

export default function ShowAthletesModal({
  open,
  onClose,
  onDataChanged,
  readOnly = false,
  initialName = null,
  hideList = false,
  onEditAthlete = undefined,
}: Props) {
  const locale = useLocale();
  const isRTL = locale === "fa";
  useBodyScrollLock(open);

  const [searchQuery, setSearchQuery] = useState("");
  const [athleteNames, setAthleteNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedName, setExpandedName] = useState<string | null>(null);
  const [entries, setEntries] = useState<AthleteEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  // Editor state (all strings)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [part1, setPart1] = useState<PartDraft>(emptyPart());
  const [part2, setPart2] = useState<PartDraft>(emptyPart());
  const [tie1, setTie1] = useState<TimeDraft>(emptyTime());
  const [tie2, setTie2] = useState<TimeDraft>(emptyTime());
  // For auto-scored events (3): meters / reps beyond time cap
  const [event3Reps, setEvent3Reps] = useState<string>("");
  // For Event 3 auto-score: milliseconds part of the completion time
  const [event3Hundredths, setEvent3Hundredths] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSearchQuery("");
    setExpandedName(initialName ?? null);
    setEditingId(null);
    setSaveError(null);
  }, [open, initialName]);

  useEffect(() => {
    if (!open || hideList) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const qs = searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : "";
        const names = await api.get<string[]>(`/competition-athletes/names${qs}`);
        if (!cancelled) setAthleteNames(names);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load athletes"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [open, searchQuery, hideList]);

  const loadEntries = useCallback(async (name: string) => {
    setEntriesLoading(true);
    try {
      const data = await api.get<{ athletes: AthleteEntry[] }>(`/competition-athletes/${encodeURIComponent(name)}`);
      setEntries(data.athletes);
    } catch { setEntries([]); }
    finally { setEntriesLoading(false); }
  }, []);

  // When opened with an initial athlete (read-only detail view), load their entries.
  useEffect(() => {
    if (open && initialName) {
      loadEntries(initialName);
    }
  }, [open, initialName, loadEntries]);

  function handleToggleExpand(name: string) {
    if (expandedName === name) {
      setExpandedName(null);
      setEditingId(null);
    } else {
      setExpandedName(name);
      setEditingId(null);
      setSaveError(null);
      loadEntries(name);
    }
  }

  async function handleDelete(name: string) {
    try {
      await api.delete(`/competition-athletes/${encodeURIComponent(name)}`);
      setAthleteNames((prev) => prev.filter((n) => n !== name));
      if (expandedName === name) setExpandedName(null);
      onDataChanged();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete athlete"));
    }
  }

  function startEditScore(entry: AthleteEntry) {
    setEditingId(entry.id);
    setSaveError(null);

    if (entry.event === 1) {
      // Auto-scored Event 1&2 (two separate rankings)
      // Event 1 → part1.num (reps) + tie1 (time_seconds)
      // Event 2 → part2.num (reps_2) + tie2 (time_seconds_2)
      setPart1(partFromStored(null, entry.reps, null, null));
      setTie1(secondsToTimeDraft(entry.time_seconds));
      setPart2(partFromStored(null, entry.reps_2, null, null));
      setTie2(secondsToTimeDraft(entry.time_seconds_2));
      setEvent3Reps("");
    } else if (entry.event === 3) {
      // Auto-scored Event 3: part1 = time, event3Ms = ms, event3Reps = meters/reps
      setPart1(partFromStored(null, null, null, entry.time_seconds));
      setEvent3Hundredths(numToStr(entry.time_hundredths));
      setEvent3Reps(numToStr(entry.reps));
      // Clear unused fields
      setPart2(emptyPart());
      setTie1(emptyTime());
      setTie2(emptyTime());
    } else {
      // Manual scoring for all other events
      setPart1(partFromStored(entry.score, entry.reps, entry.weight, entry.time_seconds));
      setPart2(partFromStored(entry.score_2, entry.reps_2, entry.weight_2, entry.time_seconds_2));
      setTie1(secondsToTimeDraft(entry.tiebreaker_value));
      setTie2(secondsToTimeDraft(entry.tiebreaker_value_2));
      setEvent3Reps("");
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setSaveError(null);
    setEvent3Reps("");
    setEvent3Hundredths("");
  }

  async function saveScore(entryId: number) {
    setSaveError(null);

    // Find the entry to know its event number
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) {
      setSaveError("Entry not found");
      return;
    }

    if (entry.event === 1) {
      // Auto-scored: Event 1&2 two separate rankings
      const payload = {
        reps: strToNum(part1.num),
        time_seconds: timeDraftToSeconds(tie1),
        reps_2: strToNum(part2.num),
        time_seconds_2: timeDraftToSeconds(tie2),
        weight: null,
        score: null,
        score_2: null,
        weight_2: null,
        tiebreaker_type: "time",
        tiebreaker_value: timeDraftToSeconds(tie1),
        tiebreaker_value_2: timeDraftToSeconds(tie2),
      };
      setSaving(true);
      try {
        await api.patch(`/competition-athletes/${entryId}`, payload);
        setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, ...payload } : e)));
        setEditingId(null);
        onDataChanged();
      } catch (err) {
        setSaveError(getErrorMessage(err, "Failed to save score"));
      } finally {
        setSaving(false);
      }
    } else if (entry.event === 3) {
      // Auto-scored: Event 3 — send time (including ms) & reps (DNF meters), score is auto-calculated
      const t = partToPayload(part1);
      const payload = {
        time_seconds: t.time_seconds,
        time_hundredths: strToNum(event3Hundredths ?? ""),
        reps: strToNum(event3Reps),
        weight: null,
        score: null,
        score_2: null,
        reps_2: null,
        weight_2: null,
        time_seconds_2: null,
        tiebreaker_type: null,
        tiebreaker_value: null,
        tiebreaker_value_2: null,
      };
      setSaving(true);
      try {
        await api.patch(`/competition-athletes/${entryId}`, payload);
        setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, ...payload } : e)));
        setEditingId(null);
        onDataChanged();
      } catch (err) {
        setSaveError(getErrorMessage(err, "Failed to save score"));
      } finally {
        setSaving(false);
      }
    } else {
      // Current manual scoring for all other events (4-9)
      const p1 = partToPayload(part1);
      const p2 = partToPayload(part2);

      const payload = {
        score: p1.score,
        reps: p1.reps,
        weight: p1.weight,
        time_seconds: p1.time_seconds,
        score_2: p2.score,
        reps_2: p2.reps,
        weight_2: p2.weight,
        time_seconds_2: p2.time_seconds,
        tiebreaker_type: "time",
        tiebreaker_value: timeDraftToSeconds(tie1),
        tiebreaker_value_2: timeDraftToSeconds(tie2),
      };

      setSaving(true);
      try {
        await api.patch(`/competition-athletes/${entryId}`, payload);
        setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, ...payload } : e)));
        setEditingId(null);
        onDataChanged();
      } catch (err) {
        setSaveError(getErrorMessage(err, "Failed to save score"));
      } finally {
        setSaving(false);
      }
    }
  }

  if (!open) return null;

  const visibleNames = hideList && initialName ? [initialName] : athleteNames;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div dir="ltr" className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-b from-[#0d0d0d] to-[#111111] shadow-2xl shadow-black/60">
        <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-[#B4E3BD]/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-3 pt-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${readOnly ? "bg-[#B4E3BD]/10 text-[#B4E3BD]" : "bg-amber-500/10 text-amber-400"}`}>
              {readOnly ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{readOnly ? "Athlete details" : "Athletes"}</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {readOnly ? "View scores & tiebreakers — read only" : "Manage competition athletes, scores & events"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-800 hover:text-white">
            <IconX />
          </button>
        </div>

        {/* Search bar */}
        {!hideList && (
          <div className="px-6 pb-3">
            <div className="relative">
              <span className={`pointer-events-none absolute inset-y-0 flex items-center text-gray-500 ${isRTL ? "right-3" : "left-3"}`}>
                <IconSearch />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search athletes by name..."
                className={`w-full rounded-xl border border-gray-800 bg-[#141414] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#B4E3BD] focus:bg-gray-900 focus:ring-1 focus:ring-[#B4E3BD]/20 ${isRTL ? "pr-10" : "pl-10"}`}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")}
                  className={`absolute inset-y-0 flex items-center text-gray-500/50 transition hover:text-gray-300 ${isRTL ? "left-3" : "right-3"}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" /></svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Athlete list */}
        <div className="coach-scroll min-h-0 flex-1 overflow-y-auto px-6 pb-4">
          {!hideList && loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <svg width="18" height="18" className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeDashoffset="6" strokeLinecap="round" /></svg>
                Loading athletes...
              </div>
            </div>
          )}

          {!hideList && !loading && error && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {!hideList && !loading && !error && athleteNames.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 text-gray-700">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              </svg>
              <p className="text-sm">{searchQuery.trim() ? "No athletes match your search." : "No athletes registered yet."}</p>
            </div>
          )}

          {visibleNames.length > 0 && (
            <div className="space-y-2">
              {visibleNames.map((name) => {
                const isExpanded = expandedName === name;
                return (
                  <div key={name} className="overflow-hidden rounded-2xl border border-gray-800 bg-[#141414]/60 transition-all duration-200">
                    {/* Collapsed row */}
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(name)}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-white/[0.03]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B4E3BD]/10 text-sm font-bold text-[#B4E3BD]">
                          {name.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="truncate text-sm font-semibold text-white">{name}</span>
                      </div>
                      <IconChevronDown open={isExpanded} />
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="space-y-3 border-t border-gray-800/60 px-4 py-4">
                        {entriesLoading ? (
                          <p className="py-4 text-center text-sm text-gray-500">Loading entries...</p>
                        ) : entries.length === 0 ? (
                          <p className="py-4 text-center text-sm text-gray-500">No entries found.</p>
                        ) : (
                          entries.map((entry) => {
                            const ec = EVENT_COLORS[entry.event] ?? EVENT_COLORS[1];
                            const ls = LEVEL_STYLES[entry.level] || LEVEL_STYLES["Beginner"];
                            const isEditing = editingId === entry.id;
                            const isCombined = entry.event === 1;

                            const summaryContent = (
                              <>
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${ec.chip}`}>
                                    <span className={`h-2 w-2 rounded-full ${ec.dot}`} />
                                    {eventLabel(entry.event)}
                                  </span>
                                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ls.badge}`}>
                                    {entry.level}
                                  </span>
                                  {entry.heat ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-300">
                                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
                                      Heat {entry.heat}
                                    </span>
                                  ) : null}
                                  {entry.line ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-300">
                                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>
                                      Line {entry.line}
                                    </span>
                                  ) : null}
                                </div>

                                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                                  <div className="flex min-w-0 flex-col items-start gap-1 sm:items-end">
                                    {/* Result (reps / weight / time) + tie breaker */}
                                    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] font-medium text-gray-500">
                                      {entry.event === 1 ? (
                                        <>
                                          <span>E1 Reps <b className="font-bold text-gray-400">{entry.reps != null ? entry.reps.toLocaleString() : "—"}</b></span>
                                          <span className="text-gray-700">•</span>
                                          <span>E1 Time <b className="font-bold tabular-nums text-gray-400">{entry.time_seconds != null ? formatTime(entry.time_seconds) : "—"}</b></span>
                                          <span className="text-gray-700">•</span>
                                          <span>E2 Reps <b className="font-bold text-gray-400">{entry.reps_2 != null ? entry.reps_2.toLocaleString() : "—"}</b></span>
                                          <span className="text-gray-700">•</span>
                                          <span>E2 Time <b className="font-bold tabular-nums text-gray-400">{entry.time_seconds_2 != null ? formatTime(entry.time_seconds_2) : "—"}</b></span>
                                        </>
                                      ) : entry.event === 3 ? (
                                        <>
                                          <span>Time <b className="font-bold tabular-nums text-gray-400">
                                            {entry.time_seconds != null
                                              ? formatTime(entry.time_seconds) + (entry.time_hundredths ? `.${String(entry.time_hundredths).padStart(2, "0")}` : "")
                                              : "—"}
                                          </b></span>
                                          <span className="text-gray-700">•</span>
                                          <span>Meters <b className="font-bold text-gray-400">{entry.reps != null ? entry.reps.toLocaleString() : "—"}</b></span>
                                        </>
                                      ) : isCombined ? (
                                        <>
                                          <span>Ev1 <b className="font-bold text-gray-400">{resultText(entry.reps, entry.weight, entry.time_seconds)}</b></span>
                                          <span className="text-gray-700">•</span>
                                          <span>Ev2 <b className="font-bold text-gray-400">{resultText(entry.reps_2, entry.weight_2, entry.time_seconds_2)}</b></span>
                                          <span className="text-gray-700">•</span>
                                          <span>
                                            Ev1 Tie <b className="font-bold tabular-nums text-gray-400">{formatTiebreaker(entry.tiebreaker_type, entry.tiebreaker_value)}</b>
                                            <span className="text-gray-700"> • </span>
                                            Ev2 Tie <b className="font-bold tabular-nums text-gray-400">{formatTiebreaker(entry.tiebreaker_type, entry.tiebreaker_value_2)}</b>
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <span><b className="font-bold text-gray-400">{resultText(entry.reps, entry.weight, entry.time_seconds)}</b></span>
                                          <span className="text-gray-700">•</span>
                                          <span>Tie <b className="font-bold tabular-nums text-gray-400">{formatTiebreaker(entry.tiebreaker_type, entry.tiebreaker_value)}</b></span>
                                        </>
                                      )}
                                    </span>

                                    {entry.event === 1 ? (
                                      <span className="flex flex-wrap items-center gap-1.5">
                                        <span className="inline-flex items-baseline gap-1.5 rounded-lg border border-[#B4E3BD]/25 bg-[#B4E3BD]/10 px-2 py-1">
                                          <span className="text-[8px] font-bold uppercase tracking-wider text-[#B4E3BD]/80">E1 Rank</span>
                                          <span className="text-sm font-black leading-none tabular-nums text-white sm:text-base">
                                            {entry.score !== null ? entry.score.toLocaleString() : <span className="font-medium text-gray-500">—</span>}
                                          </span>
                                        </span>
                                        <span className="inline-flex items-baseline gap-1.5 rounded-lg border border-[#B4E3BD]/25 bg-[#B4E3BD]/10 px-2 py-1">
                                          <span className="text-[8px] font-bold uppercase tracking-wider text-[#B4E3BD]/80">E1 Reps</span>
                                          <span className="text-sm font-black leading-none tabular-nums text-white sm:text-base">
                                            {entry.reps !== null ? entry.reps.toLocaleString() : <span className="font-medium text-gray-500">—</span>}
                                          </span>
                                        </span>
                                        <span className="inline-flex items-baseline gap-1.5 rounded-lg border border-[#B4E3BD]/25 bg-[#B4E3BD]/10 px-2 py-1">
                                          <span className="text-[8px] font-bold uppercase tracking-wider text-[#B4E3BD]/80">E2 Rank</span>
                                          <span className="text-sm font-black leading-none tabular-nums text-white sm:text-base">
                                            {entry.score_2 !== null ? entry.score_2.toLocaleString() : <span className="font-medium text-gray-500">—</span>}
                                          </span>
                                        </span>
                                        <span className="inline-flex items-baseline gap-1.5 rounded-lg border border-[#B4E3BD]/25 bg-[#B4E3BD]/10 px-2 py-1">
                                          <span className="text-[8px] font-bold uppercase tracking-wider text-[#B4E3BD]/80">E2 Reps</span>
                                          <span className="text-sm font-black leading-none tabular-nums text-white sm:text-base">
                                            {entry.reps_2 !== null ? entry.reps_2.toLocaleString() : <span className="font-medium text-gray-500">—</span>}
                                          </span>
                                        </span>
                                      </span>
                                    ) : entry.event === 3 ? (
                                      <span className="flex flex-wrap items-center gap-1.5">
                                        <span className="inline-flex items-baseline gap-1.5 rounded-lg border border-[#B4E3BD]/25 bg-[#B4E3BD]/10 px-2 py-1">
                                          <span className="text-[8px] font-bold uppercase tracking-wider text-[#B4E3BD]/80">Rank</span>
                                          <span className="text-sm font-black leading-none tabular-nums text-white sm:text-base">
                                            {entry.score !== null ? entry.score.toLocaleString() : <span className="font-medium text-gray-500">—</span>}
                                          </span>
                                        </span>
                                        <span className="inline-flex items-baseline gap-1.5 rounded-lg border border-[#B4E3BD]/25 bg-[#B4E3BD]/10 px-2 py-1">
                                          <span className="text-[8px] font-bold uppercase tracking-wider text-[#B4E3BD]/80">Time</span>
                                          <span className="text-sm font-black leading-none tabular-nums text-white sm:text-base">
                                            {entry.time_seconds != null
                                              ? formatTime(entry.time_seconds) + (entry.time_hundredths ? `.${String(entry.time_hundredths).padStart(2, "0")}` : "")
                                              : <span className="font-medium text-gray-500">—</span>}
                                          </span>
                                        </span>
                                      </span>
                                    ) : isCombined ? (
                                      <span className="flex flex-wrap items-center gap-1.5">
                                        <span className="inline-flex items-baseline gap-1.5 rounded-lg border border-[#B4E3BD]/25 bg-[#B4E3BD]/10 px-2 py-1">
                                          <span className="text-[8px] font-bold uppercase tracking-wider text-[#B4E3BD]/80">Event 1</span>
                                          <span className="text-sm font-black leading-none tabular-nums text-white sm:text-base">
                                            {entry.score !== null ? entry.score.toLocaleString() : <span className="font-medium text-gray-500">—</span>}
                                          </span>
                                        </span>
                                        <span className="inline-flex items-baseline gap-1.5 rounded-lg border border-[#B4E3BD]/25 bg-[#B4E3BD]/10 px-2 py-1">
                                          <span className="text-[8px] font-bold uppercase tracking-wider text-[#B4E3BD]/80">Event 2</span>
                                          <span className="text-sm font-black leading-none tabular-nums text-white sm:text-base">
                                            {entry.score_2 !== null ? entry.score_2.toLocaleString() : <span className="font-medium text-gray-500">—</span>}
                                          </span>
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-base font-black tabular-nums text-white sm:text-lg">
                                        {entry.score !== null ? (
                                          entry.score.toLocaleString()
                                        ) : (
                                          <span className="text-sm font-medium text-gray-500">{readOnly ? "—" : "Add Score"}</span>
                                        )}
                                      </span>
                                    )}
                                  </div>

                                  {!readOnly && (
                                    <span
                                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                                        isEditing
                                          ? "border-[#B4E3BD]/30 bg-[#B4E3BD]/10 text-[#B4E3BD]"
                                          : "border-gray-800 bg-gray-900/60 text-gray-500 group-hover:border-[#B4E3BD]/40 group-hover:text-[#B4E3BD]"
                                      }`}
                                    >
                                      {isEditing ? (
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                                      ) : (
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                      )}
                                    </span>
                                  )}
                                </div>
                              </>
                            );

                            return (
                              <div
                                key={entry.id}
                                // overflow stays visible while editing so the unit dropdown can open over the card edge
                                className={`rounded-xl border transition-colors duration-200 ${
                                  isEditing ? "border-[#B4E3BD]/30 bg-[#B4E3BD]/5" : "overflow-hidden border-gray-800/70"
                                }`}
                              >
                                {/* Summary row — tap anywhere to edit */}
                                {readOnly ? (
                                  <div className="flex w-full flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                    {summaryContent}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => (isEditing ? cancelEdit() : startEditScore(entry))}
                                    className={`group flex w-full flex-col gap-2.5 px-4 py-3 text-left transition sm:flex-row sm:items-center sm:justify-between ${isEditing ? "rounded-t-xl" : "rounded-xl"} ${ec.bg}`}
                                  >
                                    {summaryContent}
                                  </button>
                                )}

                                {/* Editor panel */}
                                {isEditing && (
                                  <form
                                    onSubmit={(e) => { e.preventDefault(); saveScore(entry.id); }}
                                    className="animate-[fadeIn_0.3s_ease-out] rounded-b-xl border-t border-[#B4E3BD]/15 bg-black/40 px-4 py-4 sm:px-5"
                                  >
                                    {entry.event === 1 ? (
                                      <>
                                        {/* Auto-scored: Event 1 — reps higher better, time tiebreaker */}
                                        <div>
                                          <span className={FIELD_LABEL}>Event 1 — Reps (primary)</span>
                                          <NumInput value={part1.num} onChange={(v) => setPart1({ ...part1, num: v, unit: "reps" })} placeholder="Reps" ariaLabel="Event 1 reps" />
                                        </div>
                                        <div className="max-w-[220px]">
                                          <TieBreakerField label="Event 1 — Time (tiebreaker)" value={tie1} onChange={setTie1} />
                                        </div>

                                        <div className="mt-4 border-t border-gray-800 pt-4" />

                                        <div>
                                          <span className={FIELD_LABEL}>Event 2 — Reps (primary)</span>
                                          <NumInput value={part2.num} onChange={(v) => setPart2({ ...part2, num: v, unit: "reps" })} placeholder="Reps" ariaLabel="Event 2 reps" />
                                        </div>
                                        <div className="max-w-[220px]">
                                          <TieBreakerField label="Event 2 — Time (tiebreaker)" value={tie2} onChange={setTie2} />
                                        </div>

                                        <p className="mt-2 text-[10px] italic leading-relaxed text-gray-500">
                                          Each event is scored separately: ranked by reps (higher better) then tie‑breaker time (lower better). Score = rank.
                                        </p>
                                      </>
                                    ) : entry.event === 3 ? (
                                      <>
                                        {/* Auto-scored: Event 3 — completion time, reps/meters for DNF */}
                                        <div>
                                          <span className={FIELD_LABEL}>Completion Time (lower is better)</span>
                                          <div className="flex items-center gap-2" dir="ltr">
                                            <TimeInput value={{ min: part1.min, sec: part1.sec }} onChange={(t) => setPart1({ ...part1, unit: "time", min: t.min, sec: t.sec })} ariaPrefix="Completion time" />
                                            <span className="shrink-0 select-none text-xs font-bold text-gray-500">.</span>
                                            <input
                                              type="text"
                                              inputMode="numeric"
                                              autoComplete="off"
                                              maxLength={2}
                                              value={event3Hundredths}
                                              onFocus={(e) => e.target.select()}
                                              onChange={(e) => {
                                                const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
                                                setEvent3Hundredths(digits);
                                              }}
                                              placeholder="hs"
                                              aria-label="Hundredths of a second"
                                              className="w-14 shrink-0 rounded-xl border border-gray-700 bg-gray-900 px-2 py-3 text-center text-sm font-bold tabular-nums text-white outline-none transition placeholder:font-medium placeholder:text-gray-500 focus:border-[#B4E3BD] focus:ring-1 focus:ring-[#B4E3BD]/20"
                                            />
                                          </div>
                                        </div>
                                        <div className="mt-4 max-w-[220px] border-t border-gray-800 pt-4">
                                          <span className={FIELD_LABEL}>Meters / Reps (if beyond time cap)</span>
                                          <NumInput value={event3Reps} onChange={setEvent3Reps} placeholder="Meters" ariaLabel="DNF meters" suffix="m" />
                                        </div>
                                        <p className="mt-2 text-[10px] italic leading-relaxed text-gray-500">
                                          Athletes finishing within the time cap are ranked by time (lower better); those who don't are ranked by meters (higher better). Score = rank.
                                        </p>
                                      </>
                                    ) : isCombined ? (
                                      <>
                                        <div>
                                          <PartTitle hint="first part">Event 1</PartTitle>
                                          <PartEditor value={part1} onChange={setPart1} ariaPrefix="Event 1" />
                                        </div>

                                        <div className="mt-4 border-t border-gray-800 pt-4">
                                          <PartTitle hint="second part">Event 2</PartTitle>
                                          <PartEditor value={part2} onChange={setPart2} ariaPrefix="Event 2" />
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-800 pt-4 sm:grid-cols-2">
                                          <TieBreakerField label="Event 1 · Tie Breaker" value={tie1} onChange={setTie1} />
                                          <TieBreakerField label="Event 2 · Tie Breaker" value={tie2} onChange={setTie2} />
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <PartEditor value={part1} onChange={setPart1} ariaPrefix="Score" />
                                        <div className="mt-4 max-w-[220px] border-t border-gray-800 pt-4">
                                          <TieBreakerField label="Tie Breaker" value={tie1} onChange={setTie1} />
                                        </div>
                                      </>
                                    )}

                                    {saveError && (
                                      <p className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
                                        {saveError}
                                      </p>
                                    )}

                                    <div className="mt-4 flex items-center justify-end gap-2.5">
                                      <button
                                        type="button"
                                        onClick={cancelEdit}
                                        disabled={saving}
                                        className="rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-400 transition hover:border-gray-500 hover:text-gray-200 disabled:opacity-50"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex min-w-[86px] items-center justify-center gap-1.5 rounded-xl bg-[#B4E3BD] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {saving ? (
                                          <>
                                            <svg width="14" height="14" className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9" strokeDasharray="28.3 28.3" strokeDashoffset="8" strokeLinecap="round" /></svg>
                                            Saving...
                                          </>
                                        ) : (
                                          <>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                            Save
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </form>
                                )}
                              </div>
                            );
                          })
                        )}

                        {/* Edit / Delete athlete */}
                        {!readOnly && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                onEditAthlete?.({
                                  name,
                                  level: entries[0]?.level ?? name,
                                  events: entries.map((e) => ({
                                    event: e.event,
                                    heat: e.heat,
                                    line: e.line,
                                  })),
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#B4E3BD]/40 px-3 py-1.5 text-xs font-semibold text-[#B4E3BD] transition hover:bg-[#B4E3BD]/10"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              Edit athlete
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Remove "${name}" from all events?`)) handleDelete(name);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/30 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:border-red-500/50 hover:bg-red-950/30"
                            >
                              <IconTrash />
                              Remove athlete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-800 px-6 py-4">
          <button type="button" onClick={onClose}
            className="rounded-full border border-gray-800 px-5 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-600"
          >Close</button>
        </div>
      </div>
    </div>
  );
}