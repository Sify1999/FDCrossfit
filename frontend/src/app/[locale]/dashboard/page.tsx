"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { api, ApiError } from "@/lib/api-client";
import { clearTokens, fetchCurrentUser, type CurrentUser } from "@/lib/auth";
import MyRecordsModal from "../components/MyRecordsModal";
import AthleteRosterModal from "../components/AthleteRosterModal";
import WorkoutComments from "../components/WorkoutComments";
import WorkoutSectionModal from "../components/workout-builder/WorkoutSectionModal";
import type { WorkoutSection as StructuredSection } from "../components/workout-builder/types";
import { formatSection } from "../components/workout-builder/section-formatter";
import { ConfirmDialog } from "../components/workout-builder/UiHelpers";
import LogWorkoutModal, { type SectionForLog } from "../components/LogWorkoutModal";
import WorkoutLogsViewer from "../components/WorkoutLogsViewer";

// ─── Sidebar Icons ────────────────────────────────────────────────────

function IconHomeSVG({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className ?? ""}>
      <rect x="5" y="10" width="14" height="12" rx="1.5" />
      <polyline points="3,7 12,1 21,7" />
    </svg>
  );
}

function IconAthletesSVG({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className ?? ""}>
      <circle cx="8" cy="6" r="4" />
      <path d="M8 10v6M6 11v-2M10 11v-2M8 16v4" />
      <circle cx="17" cy="6" r="4" />
      <path d="M17 10v6M15 11v-2M19 11v-2M17 16v4" />
    </svg>
  );
}

function IconCyclesSVG({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className ?? ""}>
      <circle cx="12" cy="12" r="8" />
      <polyline points="12 4 16 7 20 12 16 17 12 20" />
      <polyline points="12 20 8 17 4 12 8 7 12 4" />
    </svg>
  );
}

function IconLogoutSVG({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className ?? ""}>
      <path d="M12 4v16M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

type DashboardView = "home" | "athletes" | "training-cycles";

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

const INITIAL_DAY_COUNT = 30; // forward from today, inclusive of today
const LOAD_MORE_COUNT = 30;
const MAX_DAY_COUNT = 180; // forward cap

const LOAD_PREV_COUNT = 7; // one week per click, backward
const MAX_DAYS_BEFORE = 90; // backward cap

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Builds `count` consecutive days starting `startOffsetDays` away from
 * today (negative = into the past, 0 = starts today, positive = starts
 * in the future). Used for both the forward ("+30 Days") and backward
 * ("-7 Days") windows — same function, different offset/count. */
function buildDaysWindow(
  locale: string,
  startOffsetDays: number,
  count: number
): CalendarDay[] {
  const days: CalendarDay[] = [];

  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const monthFmt = new Intl.DateTimeFormat(locale, { month: "short" });
  const dayFmt = new Intl.DateTimeFormat(locale, { day: "numeric" });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + startOffsetDays
  );

  for (let i = 0; i < count; i++) {
    const date = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + i
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

/** Extract movement names + prescribed values from a workout's structured sections for logging */
function extractMovementsForLog(sections: WorkoutSection[]): SectionForLog[] {
  return sections.map((s: any) => {
    let movementDefs: SectionForLog["movements"] = [];

    if (s.type === "single" && s.movement_name) {
      // Expand movement_sets into individual rows (one per set)
      if (s.movement_sets && s.movement_sets.length > 0) {
        movementDefs = s.movement_sets.map((ms: any, i: number) => ({
          movement_name: `${s.movement_name} (Set ${i + 1})`,
          prescribed_reps: ms.reps || "",
          prescribed_unit: "reps",
          prescribed_weight: ms.weight || null,
          hideSets: true,
        }));
      } else {
        movementDefs = [{
          movement_name: s.movement_name,
          prescribed_reps: s.reps || "",
          prescribed_unit: "reps",
          prescribed_weight: s.weight || null,
        }];
      }

    } else if (s.type === "complex" || s.type === "conditioning") {
      // Collect movements from both flat movements array and EMOM interval_groups
      let allMovements: any[] = [];
      if (s.movements) allMovements = allMovements.concat(s.movements);
      if (s.format === "EMOM" && s.interval_groups) {
        for (const group of s.interval_groups) {
          if (group.movements) allMovements = allMovements.concat(group.movements);
        }
      }
      movementDefs = allMovements.map((m: any) => ({
        movement_name: m.movement_name || "",
        prescribed_reps: m.reps || "",
        prescribed_unit: m.unit || "reps",
        prescribed_weight: m.weight || null,
        // Conditioning movements don't use sets
        hideSets: s.type === "conditioning",
      })).filter((m: any) => m.movement_name);
    }

    return {
      id: s.id,
      label: s.label,
      movements: movementDefs,
      scoreType: s.score_type || "",
      ranking_direction: s.ranking_direction || "",
      format: s.format || "",
      rounds: s.rounds ?? undefined,
      timeCapMinutes: s.time_cap_minutes ?? undefined,
      rpe: s.rpe ?? undefined,
      effort: s.effort ?? undefined,
      zone: s.zone ?? undefined,
    };
  });
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
  const [athleteRosterOpen, setAthleteRosterOpen] = useState(false);

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

  // ─── Dashboard view switching ─────────────────────────────────────
  const [dashboardView, setDashboardView] = useState<DashboardView>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    clearTokens();
    setCurrentUser(null);
    router.push("/login");
  }

  // ─────────────────────────────────────────────
  // Rolling day window — starts at today, grows forward via "+30 Days"
  // and backward via "-7 Days". Both only ever grow, so a day that was
  // once shown never disappears from the array.
  // ─────────────────────────────────────────────

  const [dayCount, setDayCount] = useState(INITIAL_DAY_COUNT);
  const [daysBefore, setDaysBefore] = useState(0);

  const days = useMemo(
    () => buildDaysWindow(locale, -daysBefore, daysBefore + dayCount),
    [locale, dayCount, daysBefore]
  );

  function loadMoreDays() {
    setDayCount((c) => Math.min(c + LOAD_MORE_COUNT, MAX_DAY_COUNT));
  }

  const canLoadMore = dayCount < MAX_DAY_COUNT;
  const canLoadPrevious = daysBefore < MAX_DAYS_BEFORE;

  // Selection is tracked by date key, not array index — indices shift
  // every time days get prepended, which would otherwise silently swap
  // out the selected day underneath the user.
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() =>
    toDateKey(new Date())
  );

  useEffect(() => {
    if (!days.some((d) => d.dateKey === selectedDateKey)) {
      setSelectedDateKey(days[0]?.dateKey ?? selectedDateKey);
    }
  }, [days, selectedDateKey]);

  const selectedDay =
    days.find((d) => d.dateKey === selectedDateKey) ?? days[0];

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

  const selectedWorkout = selectedDay ? workouts[selectedDay.dateKey] : undefined;

  // ─────────────────────────────────────────────
  // Edit state (draft lives separately so Cancel is free)
  // ─────────────────────────────────────────────

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Workout | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sectionBuilderOpen, setSectionBuilderOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<StructuredSection | null>(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logsViewerOpen, setLogsViewerOpen] = useState(false);

  // ── Confirmation dialogs ──────────────────────────────────────
  const [confirmRemoveSection, setConfirmRemoveSection] = useState<string | null>(null);
  const [confirmDeleteWorkout, setConfirmDeleteWorkout] = useState(false);

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

  function addStructuredSections(sections: StructuredSection[]) {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            sections: [...prev.sections, ...sections],
          }
        : prev
    );
  }

  function editStructuredSection(section: StructuredSection) {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((s) =>
              s.id === section.id ? section : s
            ),
          }
        : prev
    );
  }

  function confirmThenRemoveSection(id: string) {
    setConfirmRemoveSection(id);
  }

  function executeRemoveSection() {
    if (!confirmRemoveSection) return;
    setDraft((prev) =>
      prev
        ? { ...prev, sections: prev.sections.filter((s) => s.id !== confirmRemoveSection) }
        : prev
    );
    setConfirmRemoveSection(null);
  }

  function removeSection(id: string) {
    setDraft((prev) =>
      prev
        ? { ...prev, sections: prev.sections.filter((s) => s.id !== id) }
        : prev
    );
  }

  async function saveDraft() {
    if (!draft || !selectedDay) return;

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
    setConfirmDeleteWorkout(false);
    if (!selectedDay) return;
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

  const dateScrollRef = useRef<HTMLDivElement | null>(null);
  // Holds the scroll container's scrollWidth captured right before we
  // prepend days for "-7 Days", so the effect below can shift scrollLeft
  // by exactly the added width — otherwise prepending content shoves the
  // currently-visible days to the right and the view visibly jumps.
  const prevScrollWidthRef = useRef<number | null>(null);

  useEffect(() => {
    const el = dateScrollRef.current;
    if (el && prevScrollWidthRef.current !== null) {
      const delta = el.scrollWidth - prevScrollWidthRef.current;
      if (delta > 0) {
        el.scrollLeft += delta;
      }
      prevScrollWidthRef.current = null;
    }
  }, [daysBefore]);

  function loadPreviousWeek() {
    const el = dateScrollRef.current;
    if (el) {
      prevScrollWidthRef.current = el.scrollWidth;
    }
    setDaysBefore((b) => Math.min(b + LOAD_PREV_COUNT, MAX_DAYS_BEFORE));
  }

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
      const loadPrevEl = realTarget?.closest<HTMLElement>("[data-load-prev]");
      const dayButton = realTarget?.closest<HTMLElement>("[data-day-key]");

      if (loadMoreEl && canLoadMore) {
        loadMoreDays();
      } else if (loadPrevEl && canLoadPrevious) {
        loadPreviousWeek();
      } else if (dayButton) {
        const key = dayButton.dataset.dayKey;

        if (key) {
          setSelectedDateKey(key);
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

  // ─── Sidebar ──────────────────────────────────────────────────────
  const navItems: { id: DashboardView; icon: React.ReactNode; label: string }[] = [
    { id: "home", icon: <IconHomeSVG />, label: "Home" },
    { id: "athletes", icon: <IconAthletesSVG />, label: "Athletes" },
    { id: "training-cycles", icon: <IconCyclesSVG />, label: "Training Cycles" },
  ];

  function renderSidebar() {
    if (!currentUser) return null;
    return (
      <div className="sidebar-wrap">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          />
        )}
        <aside
          className={`fixed left-0 top-20 z-50 h-[calc(100vh-5rem)] w-64 shrink-0 border-r border-white/5 bg-gray-950/95 transition-transform duration-300 lg:sticky lg:top-20 lg:z-auto ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Brand */}
            <div className="border-b border-white/5 px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[.25em] text-[#B4E3BD]">
                FD CrossFit
              </p>
              <p className="mt-1 truncate text-xs text-gray-500">{currentUser.username}</p>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-4 py-5 space-y-1.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setDashboardView(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                    dashboardView === item.id
                      ? "bg-[#B4E3BD]/10 text-[#B4E3BD]"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Logout */}
            <div className="border-t border-white/5 px-4 py-4">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-gray-500 transition-all duration-200 hover:bg-red-950/20 hover:text-red-400"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-gray-500">
                  <IconLogoutSVG />
                </span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    );
  }

  // ─── Home View ────────────────────────────────────────────────────
  function renderHomeView() {
    if (!currentUser) return null;
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const memberSince = currentUser.created_at
      ? new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(new Date(currentUser.created_at))
      : "—";
    return (
      <div className="px-8 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          {/* Greeting card */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex items-center justify-center w-18 h-18 rounded-full bg-[#B4E3BD]/15 shadow-lg shadow-[#B4E3BD]/5">
              <IconHomeSVG size={32} className="text-[#B4E3BD]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {greeting}, {currentUser.username}
            </h1>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-gray-400">
              Welcome to your FD CrossFit dashboard. Here you can view your training cycles,
              track your progress, and manage your profile.
            </p>
          </div>

          {/* Stats cards */}
          <div className="mt-14 grid grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 text-center backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[.25em] text-[#B4E3BD]">Role</p>
              <p className="mt-3 text-2xl font-bold capitalize text-white">{currentUser.role}</p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 text-center backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[.25em] text-[#B4E3BD]">Member Since</p>
              <p className="mt-3 text-sm font-semibold text-white">{memberSince}</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-12">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-[.25em] text-gray-500">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-5">
              <button
                type="button"
                onClick={() => setDashboardView("training-cycles")}
                className="rounded-2xl border border-gray-800 bg-gray-900/40 px-5 py-5 text-left transition-all duration-200 hover:border-[#B4E3BD]/30 hover:bg-gray-900/60"
              >
                <IconCyclesSVG className="mb-2 text-[#B4E3BD]" size={24} />
                <p className="text-sm font-semibold text-white">View Training Cycles</p>
                <p className="text-xs text-gray-500">Check today&apos;s workout</p>
              </button>
              <button
                type="button"
                onClick={() => setRecordsModalOpen(true)}
                className="rounded-2xl border border-gray-800 bg-gray-900/40 px-5 py-5 text-left transition-all duration-200 hover:border-[#B4E3BD]/30 hover:bg-gray-900/60"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mb-2 text-[#B4E3BD]">
                  <path d="M5 6l3-3 3 3-3M9 6h6M16 6l3-3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 12l14 8" strokeLinecap="round" />
                </svg>
                <p className="text-sm font-semibold text-white">My Records</p>
                <p className="text-xs text-gray-500">Update your personal bests</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Athletes View state & fetch ──────────────────────────────────
  const [athleteQuery, setAthleteQuery] = useState("");
  const [athletes, setAthletes] = useState<any[]>([]);
  const [athletesLoading, setAthletesLoading] = useState(false);
  const [athletesError, setAthletesError] = useState<string | null>(null);
  let athletesFetchCancelled = false;

  useEffect(() => {
    if (dashboardView !== "athletes" || !isCoach) return;
    athletesFetchCancelled = false;
    setAthletesLoading(true);
    setAthletesError(null);
    const timer = setTimeout(() => {
      const params = athleteQuery.trim() ? `?q=${encodeURIComponent(athleteQuery.trim())}` : "";
      api.get<any[]>(`/users${params}`)
        .then((res) => { if (athletesFetchCancelled) return; setAthletes(res); })
        .catch((err) => { if (athletesFetchCancelled) return; setAthletesError(err instanceof ApiError ? err.message : "Failed to load athletes"); })
        .finally(() => { if (athletesFetchCancelled) return; setAthletesLoading(false); });
    }, 300);
    return () => { athletesFetchCancelled = true; clearTimeout(timer); };
  }, [dashboardView, athleteQuery, isCoach]);

  function athleteInitials(a: any) {
    const source = (a.full_name?.trim() || a.username || "").trim();
    return source.slice(0, 2).toUpperCase();
  }

  function renderAthletesView() {
    return (
      <div className="px-8 py-8 sm:py-10">
        <div className="mx-auto max-w-4xl">
          {!isCoach ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-800 bg-gray-900/30 px-6 py-16 text-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-5 text-gray-600">
                <circle cx="8" cy="6" r="4" /><path d="M8 10v6M6 11v-2M10 11v-2M8 16v4" /><circle cx="17" cy="6" r="4" /><path d="M17 10v6M15 11v-2M19 11v-2M17 16v4" />
              </svg>
              <p className="text-base font-semibold text-gray-400">Coach Access Only</p>
              <p className="mt-1 text-sm text-gray-600">Only coaches and admins can browse the athlete roster.</p>
            </div>
          ) : (
            <div className="w-full">
              <div className="mb-8">
                <div className="mb-5">
                  <h2 className="text-2xl font-bold tracking-tight text-white">Athletes</h2>
                  <p className="mt-1 text-sm text-gray-400">Browse, search, and manage all registered athletes.</p>
                </div>
                <div className="relative">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-gray-600">
                    <circle cx="12" cy="12" r="7" /><line x1="9" y1="7" x2="17" y2="9" strokeWidth="1.5" /><line x1="9" y1="17" x2="17" y2="15" strokeWidth="1.5" />
                  </svg>
                  <input type="text" value={athleteQuery} onChange={(e) => setAthleteQuery(e.target.value)}
                    placeholder="Search by username, email, or phone number..."
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 ps-10 pe-10 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 transition-all focus:border-[#B4E3BD] focus:shadow-[0_0_0_1px_rgba(180,227,189,0.3)]" />
                  {athleteQuery && (
                    <button type="button" onClick={() => setAthleteQuery("")} aria-label="Clear search"
                      className="absolute inset-y-0 end-3 flex items-center text-gray-500/50 transition hover:text-gray-300">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[55vh] space-y-2.5 overflow-y-auto coach-scroll">
                {athletesLoading && (
                  <div className="flex items-center justify-center rounded-2xl border border-gray-800 bg-gray-900/40 px-6 py-12 text-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#B4E3BD] border-t-transparent" />
                    <p className="ms-2 text-sm text-gray-500">Loading athletes...</p>
                  </div>
                )}
                {!athletesLoading && athletesError && (
                  <div className="rounded-2xl border border-red-900/50 bg-red-950/20 px-6 py-8 text-center">
                    <p className="text-sm text-red-400">{athletesError}</p>
                  </div>
                )}
                {!athletesLoading && !athletesError && athletes.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/30 px-6 py-14 text-center">
                    <p className="text-sm text-gray-400">{athleteQuery.trim() ? "No athletes match your search." : "No athletes registered yet."}</p>
                  </div>
                )}
                {!athletesLoading && !athletesError && athletes.map((a) => (
                  <div key={a.id} className="flex items-center gap-3.5 rounded-2xl border border-gray-800 bg-gray-900/60 px-4 py-3.5 transition-all duration-200 hover:border-[#B4E3BD]/40 hover:bg-gray-900/80">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#B4E3BD]/15 text-sm font-bold text-[#B4E3BD] shadow-sm">{athleteInitials(a)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{a.full_name || a.username}</span>
                      <span className="block truncate text-xs text-gray-500">@{a.username}{a.email ? " · " + a.email : ""}{a.phone ? " · " + a.phone : ""}</span>
                    </span>
                    <span className="shrink-0 rounded-full border border-gray-800 px-3 py-0.5 text-[11px] font-medium capitalize text-gray-400">{a.role}</span>
                  </div>
                ))}
              </div>

              {!athletesLoading && !athletesError && athletes.length > 0 && (
                <div className="mt-5 flex items-center gap-2 text-xs text-gray-600">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#B4E3BD]/10 text-[11px] font-bold text-[#B4E3BD]">{athletes.length > 99 ? "99+" : athletes.length}</span>
                  <span>{athletes.length} athlete{athletes.length !== 1 ? "s" : ""} found</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Training Cycles View ─────────────────────────────────────────
  function renderTrainingCyclesView() {
    return (
      <div className="px-6 py-8 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B4E3BD]">Training Cycles</p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Workout Schedule</h1>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => setRecordsModalOpen(true)}
                className="rounded-full border border-[#B4E3BD]/40 bg-[#B4E3BD]/10 px-4 py-2 text-xs font-semibold text-[#B4E3BD] transition-colors hover:bg-[#B4E3BD]/20">My Records</button>
            </div>
          </header>

          {/* Day picker */}
          <section className="mb-6">
            <div ref={dateScrollRef} dir="ltr"
              className="date-scroll flex gap-3 overflow-x-auto pb-1"
              style={{ touchAction: "none", overscrollBehaviorX: "contain", scrollbarWidth: "none" }}
              onPointerDown={handleDatePointerDown}
              onPointerMove={handleDatePointerMove}
              onPointerUp={handleDatePointerUp}
              onPointerCancel={handleDatePointerUp}>
              {days.map((day) => {
                const isSelected = day.dateKey === selectedDateKey;
                const today = new Date();
                const isToday = day.date.getDate() === today.getDate() && day.date.getMonth() === today.getMonth() && day.date.getFullYear() === today.getFullYear();
                const hasWorkout = Boolean(workouts[day.dateKey]);
                return (
                  <button key={day.date.toISOString()} type="button" draggable={false} data-day-key={day.dateKey}
                    onClick={() => { setSelectedDateKey(day.dateKey); setIsEditing(false); setDraft(null); }}
                    className={`date-card relative flex min-w-[76px] shrink-0 select-none flex-col items-center rounded-2xl border px-4 py-3.5 text-center transition-all duration-200 ${isSelected ? "border-[#B4E3BD] bg-[#B4E3BD] text-black shadow-[0_8px_25px_rgba(180,227,189,0.12)]" : "border-gray-800 bg-gray-900/80 text-gray-300 hover:border-[#B4E3BD]/50 hover:bg-gray-800"}`}>
                    {isToday && <span className={`mb-1 text-[9px] font-bold uppercase tracking-[0.15em] ${isSelected ? "text-black/60" : "text-[#B4E3BD]"}`}>Today</span>}
                    <span className="text-[11px] font-medium uppercase tracking-wide opacity-70">{day.weekday}</span>
                    <span className="mt-0.5 text-2xl font-bold leading-none">{day.dayNum}</span>
                    <span className="mt-1 text-[11px] opacity-70">{day.month}</span>
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${hasWorkout ? (isSelected ? "bg-black/50" : "bg-[#B4E3BD]") : "bg-transparent"}`} />
                  </button>
                );
              })}
            </div>
          </section>

          {/* Workout for the selected day */}
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#B4E3BD]">{selectedDay.weekday}, {selectedDay.dayNum} {selectedDay.month}</h2>
              {!isEditing && !loadingWorkouts && selectedWorkout && (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setLogModalOpen(true)}
                    className="shrink-0 rounded-full border border-gray-700 px-4 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-gray-500 hover:text-white">Log workout</button>
                  {isCoach && <button type="button" onClick={startEditing}
                    className="shrink-0 rounded-full border border-[#B4E3BD]/40 bg-[#B4E3BD]/10 px-4 py-1.5 text-xs font-semibold text-[#B4E3BD] transition-colors hover:bg-[#B4E3BD]/20">Edit workout</button>}
                  {isCoach && <button type="button" onClick={() => setLogsViewerOpen(true)}
                    className="shrink-0 rounded-full border border-gray-700 px-4 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-gray-500 hover:text-white">Show Logs</button>}
                </div>
              )}
              {isCoach && !isEditing && !loadingWorkouts && !selectedWorkout && (
                <button type="button" onClick={startEditing}
                  className="shrink-0 rounded-full border border-[#B4E3BD]/40 bg-[#B4E3BD]/10 px-4 py-1.5 text-xs font-semibold text-[#B4E3BD] transition-colors hover:bg-[#B4E3BD]/20">+ Add workout</button>
              )}
            </div>

            {loadingWorkouts && <div className="rounded-3xl border border-gray-800 bg-gray-900/60 px-6 py-14 text-center text-sm text-gray-400">Loading workouts...</div>}
            {!loadingWorkouts && loadError && <div className="rounded-3xl border border-red-900/50 bg-red-950/30 px-6 py-8 text-center text-sm text-red-400">{loadError}</div>}

            {!loadingWorkouts && !loadError && !isEditing && selectedWorkout && (<div className="train-wrap">
              <div className="rounded-3xl border border-gray-800 bg-gray-900/80 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-bold tracking-tight">{selectedWorkout.title}</h3>
                </div>
                {selectedWorkout.coachName && <p className="mt-1 text-xs text-gray-500">Programmed by {selectedWorkout.coachName}</p>}
                <div className="mt-5 space-y-5">
                  {selectedWorkout.sections.map((section, i) => {
                    const sectionType = (section as any).type;
                    const isStructured = sectionType && sectionType !== "text";
                    let displayLines: string[] = [];
                    if (isStructured) { try { displayLines = formatSection(section as any); } catch { displayLines = section.content ? section.content.split("\n") : []; } }
                    else { displayLines = section.content ? section.content.split("\n") : []; }
                    return (<div key={section.id} className={i > 0 ? "border-t border-gray-800 pt-5" : ""}>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#B4E3BD]">{section.label}</p>
                      {displayLines.length > 0 ? (<div className="whitespace-pre-wrap text-sm leading-6 text-gray-300">{displayLines.map((line, li) => (
                        <p key={li} className={li === 0 && isStructured ? "font-semibold text-white" : ""}>{line || "\u00A0"}</p>
                      ))}</div>) : (<p className="whitespace-pre-wrap text-sm leading-6 text-gray-300">{section.content}</p>)}
                    </div>);
                  })}
                  {selectedWorkout.sections.length === 0 && <p className="text-sm text-gray-500">No details added yet.</p>}
                </div>
              </div>
              <WorkoutComments workoutDate={selectedDateKey} isCoach={isCoach} />
            </div>)}

            {!loadingWorkouts && !loadError && !isEditing && !selectedWorkout && (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-800 bg-gray-900/40 px-6 py-14 text-center">
                <p className="text-sm text-gray-400">No workout has been programmed for this day yet.</p>
                {isCoach && <button type="button" onClick={startEditing}
                  className="mt-4 rounded-full bg-[#B4E3BD] px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white active:scale-[0.98]">+ Add workout</button>}
              </div>
            )}

            {isEditing && draft && (
              <div className="rounded-3xl border border-[#B4E3BD]/30 bg-gray-900/80 p-5 sm:p-6">
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div><label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Title</label>
                    <input className={inputClasses} value={draft.title}
                      onChange={(e) => updateDraftField("title", e.target.value)} placeholder="e.g. Strength + Metcon" /></div>
                  <div><label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Coach name (optional)</label>
                    <input className={inputClasses} value={draft.coachName ?? ""}
                      onChange={(e) => updateDraftField("coachName", e.target.value || undefined)} placeholder="Your name" /></div>
                </div>
                {draft.sections.length > 0 && (<div className="mt-4 space-y-2">
                  {draft.sections.map((s: any, i) => (<div key={s.id} className="flex items-start gap-3 rounded-2xl border border-gray-800 bg-gray-950/60 px-4 py-3.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B4E3BD]/15 text-xs font-bold text-[#B4E3BD]">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{s.label || "Untitled section"}</p>
                      {s.type && s.type !== "text" && <p className="text-xs text-gray-500">
                        {s.type === "single" && `Single movement${s.movement_name ? ` \u2014 ${s.movement_name}` : ""}`}
                        {s.type === "complex" && `Complex${s.movement_count ? ` (${s.movement_count} movements)` : ""}`}
                        {s.type === "conditioning" && "Conditioning"}
                      </p>}
                    </div>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => { setEditingSection(s); setTimeout(() => setSectionBuilderOpen(true), 10); }}
                        className="rounded-lg border border-gray-800 px-2.5 py-1 text-[11px] font-medium text-gray-400 transition hover:border-[#B4E3BD]/40 hover:text-[#B4E3BD]">Edit</button>
                      <button type="button" onClick={() => setConfirmRemoveSection(s.id)}
                        className="rounded-lg border border-gray-800 px-2.5 py-1 text-[11px] font-medium text-red-400/60 transition hover:border-red-900/40 hover:text-red-400">Remove</button>
                    </div>
                  </div>))}
                </div>)}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => { setEditingSection(null); setSectionBuilderOpen(true); }}
                    className="rounded-full border border-dashed border-gray-700 px-4 py-2 text-xs font-semibold text-gray-400 transition hover:border-[#B4E3BD]/50 hover:text-[#B4E3BD]">+ Add section</button>
                </div>
                {saveError && <p className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">{saveError}</p>}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={saveDraft} disabled={saving}
                    className="rounded-full bg-[#B4E3BD] px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
                  <button type="button" onClick={cancelEditing} disabled={saving}
                    className="rounded-full border border-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-600">Cancel</button>
                  {selectedWorkout && <button type="button" onClick={() => setConfirmDeleteWorkout(true)} disabled={saving}
                    className="ms-auto rounded-full px-4 py-2.5 text-sm font-semibold text-red-400/80 transition-colors hover:text-red-400">Delete workout</button>}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

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
    <main className="flex min-h-[calc(100vh-5rem)] bg-gray-950 text-white">
      {/* Mobile hamburger */}
      <button type="button" onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-24 z-50 flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900/80 text-gray-400 backdrop-blur-sm transition-all hover:border-[#B4E3BD]/50 hover:text-[#B4E3BD] lg:hidden">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {renderSidebar()}

      <div className="flex-1 min-h-[calc(100vh-5rem)] overflow-y-auto">
        {dashboardView === "home" && renderHomeView()}
        {dashboardView === "athletes" && renderAthletesView()}
        {dashboardView === "training-cycles" && renderTrainingCyclesView()}
      </div>

      {/* ───── Modals ────────────────────────────────────────────────── */}
      <MyRecordsModal
        open={recordsModalOpen}
        onClose={() => setRecordsModalOpen(false)}
      />
      <LogWorkoutModal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        workoutDate={selectedDay?.dateKey ?? ""}
        sections={selectedWorkout ? extractMovementsForLog(selectedWorkout.sections) : []}
      />
      {isCoach && (
        <WorkoutLogsViewer
          open={logsViewerOpen}
          onClose={() => setLogsViewerOpen(false)}
          workoutDate={selectedDay?.dateKey ?? ""}
        />
      )}
      {isCoach && (
        <AthleteRosterModal
          open={athleteRosterOpen}
          onClose={() => setAthleteRosterOpen(false)}
        />
      )}
      <WorkoutSectionModal
        open={sectionBuilderOpen}
        onClose={() => {
          setSectionBuilderOpen(false);
          setTimeout(() => setEditingSection(null), 200);
        }}
        onAdd={addStructuredSections}
        editSection={editingSection}
        onEdit={editingSection ? editStructuredSection : undefined}
      />
      <ConfirmDialog
        open={confirmRemoveSection !== null}
        title="Remove section"
        message="Are you sure you want to remove this section? This cannot be undone."
        confirmLabel="Remove"
        onConfirm={executeRemoveSection}
        onCancel={() => setConfirmRemoveSection(null)}
      />
      <ConfirmDialog
        open={confirmDeleteWorkout}
        title="Delete workout"
        message="Are you sure you want to delete the entire workout for this day? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={deleteWorkout}
        onCancel={() => setConfirmDeleteWorkout(false)}
      />
    </main>
  );
}