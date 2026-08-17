"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { api, ApiError } from "@/lib/api-client";
import { fetchCurrentUser, type CurrentUser } from "@/lib/auth";
import MyRecordsModal from "../components/MyRecordsModal";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type WorkoutSection = {
  id: string;
  label: string;
  content: string;
};

type Workout = {
  title: string;
  coachName?: string;
  sections: WorkoutSection[];
};

type ApiWorkout = {
  id: number;
  date: string;
  title: string;
  coach_name: string | null;
  sections: WorkoutSection[];
};

type CalendarDay = {
  date: Date;
  dateKey: string;
  weekday: string;
  dayNum: string;
  month: string;
};

const INITIAL_DAY_COUNT = 30;
const LOAD_MORE_COUNT = 30;
const MAX_DAY_COUNT = 180; // safety cap so the fetched range can't grow forever

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildUpcomingDays(locale: string, count: number): CalendarDay[] {
  const days: CalendarDay[] = [];

  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const monthFmt = new Intl.DateTimeFormat(locale, { month: "short" });
  const dayFmt = new Intl.DateTimeFormat(locale, { day: "numeric" });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + i
    );

    days.push({
      date,
      dateKey: toDateKey(date),
      weekday: weekdayFmt.format(date),
      dayNum: dayFmt.format(date),
      month: monthFmt.format(date),
    });
  }

  return days;
}

function newSectionId() {
  return Math.random().toString(36).slice(2, 9);
}

// ─────────────────────────────────────────────
// Backend calls
// ─────────────────────────────────────────────

async function fetchWorkoutsInRange(
  from: string,
  to: string
): Promise<Record<string, Workout>> {
  const result = await api.get<ApiWorkout[]>(
    `/workouts?date_from=${from}&date_to=${to}`
  );

  const map: Record<string, Workout> = {};
  for (const w of result) {
    map[w.date] = {
      title: w.title,
      coachName: w.coach_name ?? undefined,
      sections: w.sections,
    };
  }
  return map;
}

async function persistWorkout(dateKey: string, workout: Workout): Promise<void> {
  await api.put<ApiWorkout>(`/workouts/${dateKey}`, {
    title: workout.title,
    coach_name: workout.coachName || null,
    sections: workout.sections,
  });
}

async function deleteWorkoutRemote(dateKey: string): Promise<void> {
  await api.delete(`/workouts/${dateKey}`);
}

export default function DashboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("dashboardPage");

  // ─────────────────────────────────────────────
  // Auth gate — this page is for logged-in members/coaches only.
  // Everyone gets role="member" by default, so "logged in" is the bar.
  // ─────────────────────────────────────────────

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [recordsModalOpen, setRecordsModalOpen] = useState(false);
  
  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser().then((user) => {
      if (cancelled) return;
      setAuthChecked(true);
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const isCoach = currentUser?.role === "coach" || currentUser?.role === "admin";

  // ─────────────────────────────────────────────
  // Rolling day window — starts at 30, grows via the "+30 Days" card
  // ─────────────────────────────────────────────

  const [dayCount, setDayCount] = useState(INITIAL_DAY_COUNT);

  const days = useMemo(
    () => buildUpcomingDays(locale, dayCount),
    [locale, dayCount]
  );

  function loadMoreDays() {
    setDayCount((c) => Math.min(c + LOAD_MORE_COUNT, MAX_DAY_COUNT));
  }

  const canLoadMore = dayCount < MAX_DAY_COUNT;

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    if (selectedDayIndex >= days.length) {
      setSelectedDayIndex(0);
    }
  }, [days, selectedDayIndex]);

  const selectedDay = days[Math.min(selectedDayIndex, days.length - 1)];

  // ─────────────────────────────────────────────
  // Workout data — fetched from the backend for the visible range
  // ─────────────────────────────────────────────

  const [workouts, setWorkouts] = useState<Record<string, Workout>>({});
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return; // don't fetch until we know the visitor is allowed here

    let cancelled = false;

    async function load() {
      setLoadingWorkouts(true);
      setLoadError(null);
      try {
        const from = days[0].dateKey;
        const to = days[days.length - 1].dateKey;
        const map = await fetchWorkoutsInRange(from, to);
        if (!cancelled) setWorkouts(map);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : "Failed to load workouts");
        }
      } finally {
        if (!cancelled) setLoadingWorkouts(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [days, currentUser]);

  const selectedWorkout = workouts[selectedDay.dateKey];

  // ─────────────────────────────────────────────
  // Edit state (draft lives separately so Cancel is free)
  // ─────────────────────────────────────────────

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Workout | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function startEditing() {
    setSaveError(null);
    setDraft(
      selectedWorkout
        ? JSON.parse(JSON.stringify(selectedWorkout))
        : { title: "", coachName: "", sections: [] }
    );
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setDraft(null);
    setSaveError(null);
  }

  function updateDraftField<K extends keyof Workout>(key: K, value: Workout[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateSection(id: string, field: "label" | "content", value: string) {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((s) =>
              s.id === id ? { ...s, [field]: value } : s
            ),
          }
        : prev
    );
  }

  function addSection() {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            sections: [
              ...prev.sections,
              { id: newSectionId(), label: "New section", content: "" },
            ],
          }
        : prev
    );
  }

  function removeSection(id: string) {
    setDraft((prev) =>
      prev
        ? { ...prev, sections: prev.sections.filter((s) => s.id !== id) }
        : prev
    );
  }

  async function saveDraft() {
    if (!draft) return;

    const dateKey = selectedDay.dateKey;
    const cleaned: Workout = {
      ...draft,
      title: draft.title.trim() || "Untitled workout",
      sections: draft.sections.filter(
        (s) => s.label.trim() || s.content.trim()
      ),
    };

    setSaving(true);
    setSaveError(null);

    try {
      await persistWorkout(dateKey, cleaned);
      setWorkouts((prev) => ({ ...prev, [dateKey]: cleaned }));
      setIsEditing(false);
      setDraft(null);
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Failed to save workout. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteWorkout() {
    const dateKey = selectedDay.dateKey;
    setSaving(true);
    setSaveError(null);

    try {
      await deleteWorkoutRemote(dateKey);
      setWorkouts((prev) => {
        const next = { ...prev };
        delete next[dateKey];
        return next;
      });
      setIsEditing(false);
      setDraft(null);
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Failed to delete workout. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // ─────────────────────────────────────────────
  // Date drag / momentum
  // ─────────────────────────────────────────────

  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const velocityRef = useRef(0);
  const pointerSamplesRef = useRef<{ x: number; t: number }[]>([]);
  const momentumFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (momentumFrameRef.current !== null) {
        cancelAnimationFrame(momentumFrameRef.current);
      }
    };
  }, []);

  function stopMomentum() {
    if (momentumFrameRef.current !== null) {
      cancelAnimationFrame(momentumFrameRef.current);
      momentumFrameRef.current = null;
    }
    velocityRef.current = 0;
  }

  function startMomentum(el: HTMLDivElement) {
    const FRICTION = 0.95;
    const MIN_VELOCITY = 0.02;

    function step() {
      velocityRef.current *= FRICTION;

      if (Math.abs(velocityRef.current) < MIN_VELOCITY) {
        momentumFrameRef.current = null;
        return;
      }

      el.scrollLeft += velocityRef.current * 16;

      const maxScroll = el.scrollWidth - el.clientWidth;

      if (el.scrollLeft <= 0) {
        el.scrollLeft = 0;
        velocityRef.current = 0;
        momentumFrameRef.current = null;
        return;
      }

      if (el.scrollLeft >= maxScroll) {
        el.scrollLeft = maxScroll;
        velocityRef.current = 0;
        momentumFrameRef.current = null;
        return;
      }

      momentumFrameRef.current = requestAnimationFrame(step);
    }

    momentumFrameRef.current = requestAnimationFrame(step);
  }

  function handleDatePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    stopMomentum();

    const el = e.currentTarget;

    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartScrollRef.current = el.scrollLeft;
    pointerSamplesRef.current = [{ x: e.clientX, t: performance.now() }];

    el.setPointerCapture(e.pointerId);
  }

  function handleDatePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return;

    const el = e.currentTarget;
    const distance = e.clientX - dragStartXRef.current;

    el.scrollLeft = dragStartScrollRef.current - distance;

    const now = performance.now();
    pointerSamplesRef.current.push({ x: e.clientX, t: now });
    pointerSamplesRef.current = pointerSamplesRef.current.filter(
      (sample) => now - sample.t < 100
    );
  }

  function handleDatePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;

    const el = e.currentTarget;

    if (el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }

    const totalDistance = Math.abs(e.clientX - dragStartXRef.current);
    const TAP_THRESHOLD = 6;

    if (totalDistance < TAP_THRESHOLD) {
      const realTarget = document.elementFromPoint(e.clientX, e.clientY);
      const loadMoreEl = realTarget?.closest<HTMLElement>("[data-load-more]");
      const dayButton = realTarget?.closest<HTMLElement>("[data-day-index]");

      if (loadMoreEl && canLoadMore) {
        loadMoreDays();
      } else if (dayButton) {
        const index = Number(dayButton.dataset.dayIndex);

        if (!Number.isNaN(index)) {
          setSelectedDayIndex(index);
          setIsEditing(false);
          setDraft(null);
        }
      }
    }

    const samples = pointerSamplesRef.current;

    if (samples.length >= 2) {
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = last.t - first.t;

      if (dt > 0) {
        const dx = last.x - first.x;
        velocityRef.current = -dx / dt;
      } else {
        velocityRef.current = 0;
      }
    } else {
      velocityRef.current = 0;
    }

    if (Math.abs(velocityRef.current) > 0) {
      startMomentum(el);
    }
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  const inputClasses =
    "w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-[#B4E3BD] transition-colors";

  // Still checking the session, or we're mid-redirect to /login.
  if (!authChecked || !currentUser) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gray-950 text-white">
        <p className="text-sm text-gray-400">
          {!authChecked ? "Checking your session..." : t("notLoggedIn")}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-950 px-4 py-10 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#B4E3BD]">
              FD CrossFit
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("welcome")}, {currentUser.username}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
              Pick a day to see what&apos;s programmed.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRecordsModalOpen(true)}
            className="shrink-0 rounded-full border border-[#B4E3BD]/40 bg-[#B4E3BD]/10 px-4 py-2 text-xs font-semibold text-[#B4E3BD] transition-colors hover:bg-[#B4E3BD]/20"
          >
            + Add Note
          </button>
        </header>

        {/* ─────────────────────────────────────────
            Day picker
        ───────────────────────────────────────── */}

        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#B4E3BD]">
            Choose a day
          </h2>

          <div
            dir="ltr"
            className="date-scroll flex gap-3 overflow-x-auto pb-1"
            style={{
              touchAction: "none",
              overscrollBehaviorX: "contain",
              scrollbarWidth: "none",
            }}
            onPointerDown={handleDatePointerDown}
            onPointerMove={handleDatePointerMove}
            onPointerUp={handleDatePointerUp}
            onPointerCancel={handleDatePointerUp}
          >
            {days.map((day, i) => {
              const isActive = i === selectedDayIndex;
              const today = new Date();

              const isToday =
                day.date.getDate() === today.getDate() &&
                day.date.getMonth() === today.getMonth() &&
                day.date.getFullYear() === today.getFullYear();

              const hasWorkout = Boolean(workouts[day.dateKey]);

              return (
                <button
                  key={day.date.toISOString()}
                  type="button"
                  draggable={false}
                  data-day-index={i}
                  onClick={() => {
                    setSelectedDayIndex(i);
                    setIsEditing(false);
                    setDraft(null);
                  }}
                  className={`date-card relative flex min-w-[76px] shrink-0 select-none flex-col items-center rounded-2xl border px-4 py-3.5 text-center transition-all duration-200 ${
                    isActive
                      ? "border-[#B4E3BD] bg-[#B4E3BD] text-black shadow-[0_8px_25px_rgba(180,227,189,0.12)]"
                      : "border-gray-800 bg-gray-900/80 text-gray-300 hover:border-[#B4E3BD]/50 hover:bg-gray-800"
                  }`}
                >
                  {isToday && (
                    <span
                      className={`mb-1 text-[9px] font-bold uppercase tracking-[0.15em] ${
                        isActive ? "text-black/60" : "text-[#B4E3BD]"
                      }`}
                    >
                      Today
                    </span>
                  )}

                  <span className="text-[11px] font-medium uppercase tracking-wide opacity-70">
                    {day.weekday}
                  </span>

                  <span className="mt-0.5 text-2xl font-bold leading-none">
                    {day.dayNum}
                  </span>

                  <span className="mt-1 text-[11px] opacity-70">
                    {day.month}
                  </span>

                  <span
                    className={`mt-1.5 h-1.5 w-1.5 rounded-full ${
                      hasWorkout
                        ? isActive
                          ? "bg-black/50"
                          : "bg-[#B4E3BD]"
                        : "bg-transparent"
                    }`}
                  />
                </button>
              );
            })}

            {/* Load-more trigger — sits at the end of the row, so scrolling
                to the last day surfaces it naturally. */}
            {canLoadMore && (
              <button
                type="button"
                draggable={false}
                data-load-more="true"
                onClick={loadMoreDays}
                className="date-card relative flex min-w-[76px] shrink-0 select-none flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-gray-700 bg-gray-900/40 px-4 py-3.5 text-center text-gray-400 transition-all duration-200 hover:border-[#B4E3BD]/60 hover:text-[#B4E3BD]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-[10px] font-semibold uppercase tracking-wide">
                  +{LOAD_MORE_COUNT} Days
                </span>
              </button>
            )}
          </div>
        </section>

        {/* ─────────────────────────────────────────
            Workout for the selected day
        ───────────────────────────────────────── */}

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#B4E3BD]">
              {selectedDay.weekday}, {selectedDay.dayNum} {selectedDay.month}
            </h2>

            {isCoach && !isEditing && !loadingWorkouts && (
              <button
                type="button"
                onClick={startEditing}
                className="shrink-0 rounded-full border border-[#B4E3BD]/40 bg-[#B4E3BD]/10 px-4 py-1.5 text-xs font-semibold text-[#B4E3BD] transition-colors hover:bg-[#B4E3BD]/20"
              >
                {selectedWorkout ? "Edit workout" : "+ Add workout"}
              </button>
            )}
          </div>

          {loadingWorkouts && (
            <div className="rounded-3xl border border-gray-800 bg-gray-900/60 px-6 py-14 text-center text-sm text-gray-400">
              Loading workouts...
            </div>
          )}

          {!loadingWorkouts && loadError && (
            <div className="rounded-3xl border border-red-900/50 bg-red-950/30 px-6 py-8 text-center text-sm text-red-400">
              {loadError}
            </div>
          )}

          {!loadingWorkouts && !loadError && !isEditing && selectedWorkout && (
            <div className="rounded-3xl border border-gray-800 bg-gray-900/80 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-bold tracking-tight">
                  {selectedWorkout.title}
                </h3>
              </div>

              {selectedWorkout.coachName && (
                <p className="mt-1 text-xs text-gray-500">
                  Programmed by {selectedWorkout.coachName}
                </p>
              )}

              <div className="mt-5 space-y-5">
                {selectedWorkout.sections.map((section, i) => (
                  <div
                    key={section.id}
                    className={i > 0 ? "border-t border-gray-800 pt-5" : ""}
                  >
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#B4E3BD]">
                      {section.label}
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-300">
                      {section.content}
                    </p>
                  </div>
                ))}

                {selectedWorkout.sections.length === 0 && (
                  <p className="text-sm text-gray-500">No details added yet.</p>
                )}
              </div>
            </div>
          )}

          {!loadingWorkouts && !loadError && !isEditing && !selectedWorkout && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-800 bg-gray-900/40 px-6 py-14 text-center">
              <p className="text-sm text-gray-400">
                No workout has been programmed for this day yet.
              </p>
              {isCoach && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="mt-4 rounded-full bg-[#B4E3BD] px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white active:scale-[0.98]"
                >
                  + Add workout
                </button>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────
              Edit form (coach only)
          ───────────────────────────────────────── */}

          {isEditing && draft && (
            <div className="rounded-3xl border border-[#B4E3BD]/30 bg-gray-900/80 p-5 sm:p-6">
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Title
                  </label>
                  <input
                    className={inputClasses}
                    value={draft.title}
                    onChange={(e) => updateDraftField("title", e.target.value)}
                    placeholder="e.g. Strength + Metcon"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Coach
                  </label>
                  <input
                    className={inputClasses}
                    value={draft.coachName ?? ""}
                    onChange={(e) =>
                      updateDraftField("coachName", e.target.value)
                    }
                    placeholder="e.g. Ali Ghasemi"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {draft.sections.map((section) => (
                  <div
                    key={section.id}
                    className="rounded-2xl border border-gray-800 bg-gray-950 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <input
                        className={`${inputClasses} font-semibold`}
                        value={section.label}
                        onChange={(e) =>
                          updateSection(section.id, "label", e.target.value)
                        }
                        placeholder="Section name, e.g. WOD"
                      />
                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        aria-label="Remove section"
                        className="shrink-0 rounded-full border border-gray-800 px-3 py-2 text-xs text-gray-400 transition-colors hover:border-red-400/50 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>

                    <textarea
                      className={`${inputClasses} min-h-[96px] resize-y`}
                      value={section.content}
                      onChange={(e) =>
                        updateSection(section.id, "content", e.target.value)
                      }
                      placeholder="e.g. 21-15-9&#10;Thrusters&#10;Pull-ups"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSection}
                  className="w-full rounded-2xl border border-dashed border-gray-800 py-3 text-sm font-semibold text-gray-400 transition-colors hover:border-[#B4E3BD]/50 hover:text-[#B4E3BD]"
                >
                  + Add section
                </button>
              </div>

              {saveError && (
                <p className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
                  {saveError}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={saving}
                  className="rounded-full bg-[#B4E3BD] px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>

                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="rounded-full border border-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-600"
                >
                  Cancel
                </button>

                {selectedWorkout && (
                  <button
                    type="button"
                    onClick={deleteWorkout}
                    disabled={saving}
                    className="ml-auto rounded-full px-4 py-2.5 text-sm font-semibold text-red-400/80 transition-colors hover:text-red-400"
                  >
                    Delete workout
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
      <MyRecordsModal
        open={recordsModalOpen}
        onClose={() => setRecordsModalOpen(false)}
      />
    </main>
  );
}