"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";

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

type CalendarDay = {
  date: Date;
  dateKey: string; // yyyy-mm-dd, used as the lookup key for workouts
  weekday: string;
  dayNum: string;
  month: string;
};

const DAYS_TO_SHOW = 30;

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildUpcomingDays(locale: string): CalendarDay[] {
  const days: CalendarDay[] = [];

  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const monthFmt = new Intl.DateTimeFormat(locale, { month: "short" });
  const dayFmt = new Intl.DateTimeFormat(locale, { day: "numeric" });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < DAYS_TO_SHOW; i++) {
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
// STATIC DEMO DATA
//
// TODO(backend): this whole block goes away once you're connected.
// Replace `buildDemoWorkouts` with something like:
//
//   async function loadWorkouts(fromKey: string, toKey: string) {
//     const res = await fetch(`/api/workouts?from=${fromKey}&to=${toKey}`);
//     return (await res.json()) as Record<string, Workout>;
//   }
//
// and call it from a useEffect keyed on `days`.
// ─────────────────────────────────────────────

const DEMO_TEMPLATES: Workout[] = [
  {
    title: "Strength + Metcon",
    coachName: "Ali Ghasemi",
    sections: [
      { id: "warmup", label: "Warm-up", content: "3 rounds:\n10 air squats\n10 PVC pass-throughs\n200m run" },
      { id: "strength", label: "Strength", content: "Back Squat\n5-5-5-5-5, building to a heavy 5" },
      { id: "wod", label: "WOD", content: "For time:\n21-15-9\nThrusters (42.5/30kg)\nPull-ups" },
      { id: "cooldown", label: "Cool-down", content: "5 min easy row + hip stretch" },
    ],
  },
  {
    title: "Engine Day",
    coachName: "Ahmad",
    sections: [
      { id: "warmup", label: "Warm-up", content: "500m row easy\nDynamic mobility" },
      { id: "wod", label: "WOD", content: "AMRAP 20:\n15 cal bike\n12 burpees\n9 box jumps" },
      { id: "cooldown", label: "Cool-down", content: "Walk it out, static stretch" },
    ],
  },
  {
    title: "Gymnastics Skill",
    coachName: "Arsalan",
    sections: [
      { id: "warmup", label: "Warm-up", content: "Shoulder activation + wrist prep" },
      { id: "skill", label: "Skill", content: "10 min: handstand hold practice" },
      { id: "wod", label: "WOD", content: "5 rounds:\n8 strict pull-ups\n12 push-ups\n16 sit-ups" },
    ],
  },
  {
    title: "Rest / Recovery",
    coachName: "Arvin",
    sections: [
      { id: "notes", label: "Notes", content: "Optional: light mobility session or a 20 min walk." },
    ],
  },
];

function buildDemoWorkouts(days: CalendarDay[]): Record<string, Workout> {
  const map: Record<string, Workout> = {};

  days.forEach((day, i) => {
    // Deep-clone so editing one day never mutates the shared template.
    map[day.dateKey] = JSON.parse(
      JSON.stringify(DEMO_TEMPLATES[i % DEMO_TEMPLATES.length])
    );
  });

  return map;
}

// ─────────────────────────────────────────────
// Backend stubs
//
// TODO(backend): point these at your real endpoints. Keeping them as
// isolated functions means the rest of the component doesn't change
// when you wire up the API — only these two functions do.
// ─────────────────────────────────────────────

async function persistWorkout(dateKey: string, workout: Workout): Promise<void> {
  // await fetch("/api/workouts", {
  //   method: "PUT",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ dateKey, workout }),
  // });
  return Promise.resolve();
}

async function deleteWorkoutRemote(dateKey: string): Promise<void> {
  // await fetch(`/api/workouts/${dateKey}`, { method: "DELETE" });
  return Promise.resolve();
}

export default function WorkoutPage() {
  const locale = useLocale();

  // ─────────────────────────────────────────────
  // Coach mode
  //
  // TODO(backend/auth): replace this with your real "is this user a
  // coach" check (session role, JWT claim, etc). Left as a toggle for
  // now so you can demo both views.
  // ─────────────────────────────────────────────

  const [isCoach, setIsCoach] = useState(true);

  // ─────────────────────────────────────────────
  // Calendar + workout state
  // ─────────────────────────────────────────────

  const days = useMemo(() => buildUpcomingDays(locale), [locale]);

  const [workouts, setWorkouts] = useState<Record<string, Workout>>(() =>
    buildDemoWorkouts(days)
  );

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const selectedDay = days[selectedDayIndex];
  const selectedWorkout = workouts[selectedDay.dateKey];

  // ─────────────────────────────────────────────
  // Edit state (draft lives separately so Cancel is free)
  // ─────────────────────────────────────────────

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Workout | null>(null);
  const [saving, setSaving] = useState(false);

  function startEditing() {
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

    // Optimistic update so the UI feels instant.
    setWorkouts((prev) => ({ ...prev, [dateKey]: cleaned }));

    try {
      await persistWorkout(dateKey, cleaned);
    } finally {
      setSaving(false);
      setIsEditing(false);
      setDraft(null);
    }
  }

  async function deleteWorkout() {
    const dateKey = selectedDay.dateKey;

    setWorkouts((prev) => {
      const next = { ...prev };
      delete next[dateKey];
      return next;
    });

    setIsEditing(false);
    setDraft(null);

    await deleteWorkoutRemote(dateKey);
  }

  // ─────────────────────────────────────────────
  // Date drag / momentum state (unchanged from the booking page)
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
      const dayButton = realTarget?.closest<HTMLElement>("[data-day-index]");

      if (dayButton) {
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

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-950 px-4 py-10 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#B4E3BD]">
              FD CrossFit
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Workout of the Day
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
              Pick a day to see what&apos;s programmed.
            </p>
          </div>

          {/* Demo-only coach toggle — remove once real auth decides this */}
          <button
            type="button"
            onClick={() => setIsCoach((v) => !v)}
            className="shrink-0 rounded-full border border-gray-800 bg-gray-900/80 px-4 py-2 text-xs font-semibold text-gray-300 transition-colors hover:border-[#B4E3BD]/50"
          >
            {isCoach ? "Coach view" : "Member view"}
          </button>
        </header>

        {/* ─────────────────────────────────────────
            Day picker
        ───────────────────────────────────────── */}

        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#B4E3BD]">
              Choose a day
            </h2>
          </div>

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

                  {/* Small dot to show at a glance which days have a workout set */}
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

            {isCoach && !isEditing && (
              <button
                type="button"
                onClick={startEditing}
                className="shrink-0 rounded-full border border-[#B4E3BD]/40 bg-[#B4E3BD]/10 px-4 py-1.5 text-xs font-semibold text-[#B4E3BD] transition-colors hover:bg-[#B4E3BD]/20"
              >
                {selectedWorkout ? "Edit workout" : "+ Add workout"}
              </button>
            )}
          </div>

          {!isEditing && selectedWorkout && (
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

          {!isEditing && !selectedWorkout && (
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
                  className="rounded-full border border-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-600"
                >
                  Cancel
                </button>

                {selectedWorkout && (
                  <button
                    type="button"
                    onClick={deleteWorkout}
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
    </main>
  );
}
