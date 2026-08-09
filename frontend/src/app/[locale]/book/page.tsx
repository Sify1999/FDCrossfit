"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";

type Coach = {
  id: string;
  name: string;
  image: string;
};

const COACHES: Coach[] = [
  { id: "ali", name: "Ali Ghasemi", image: "/images/coaches/ali.jpg" },
  { id: "ahmad", name: "Ahmad", image: "/images/coaches/ahmad.jpg" },
  { id: "arsalan", name: "Arsalan", image: "/images/coaches/arsalan.jpg" },
  { id: "arvin", name: "Arvin", image: "/images/coaches/arvin.jpg" },
];

const START_HOUR = 8;
const END_HOUR = 20;

type TimeSlot = {
  hour: number;
  coach: Coach;
};

type CalendarDay = {
  date: Date;
  weekday: string;
  dayNum: string;
  month: string;
};

function buildDaySlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    // Placeholder until real backend availability exists.
    const coach = COACHES[hour % COACHES.length];
    slots.push({ hour, coach });
  }
  return slots;
}

const DAYS_TO_SHOW = 30;

function buildUpcomingDays(locale: string): CalendarDay[] {
  const days: CalendarDay[] = [];

  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const monthFmt = new Intl.DateTimeFormat(locale, { month: "short" });
  const dayFmt = new Intl.DateTimeFormat(locale, { day: "numeric" });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < DAYS_TO_SHOW; i++) {
    // Building a fresh Date from today's components each time (rather than
    // mutating one Date object with setDate in a loop) avoids the classic
    // bug where repeated setDate calls drift once you cross a DST boundary.
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);

    days.push({
      date,
      weekday: weekdayFmt.format(date),
      dayNum: dayFmt.format(date),
      month: monthFmt.format(date),
    });
  }

  return days;
}

export default function BookPage() {
  const t = useTranslations("bookPage");
  const locale = useLocale();
  const router = useRouter();

  // ─── Auth gate ────────────────────────────────────────────────
  // No dedicated auth context yet, so this checks localStorage directly.
  // Once a real /users/me endpoint exists, this should also verify
  // that the token is still valid.
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    setCheckingAuth(false);
  }, [router]);

  // ─── Booking state ────────────────────────────────────────────
  const days = useMemo(() => buildUpcomingDays(locale), [locale]);
  const slots = useMemo(() => buildDaySlots(), []);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // ─── Date drag + momentum state ────────────────────────────
  // Refs (not state) for anything read inside a pointermove/rAF loop —
  // state updates are async and would be stale mid-gesture.
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const velocityRef = useRef(0);
  const pointerSamplesRef = useRef<{ x: number; t: number }[]>([]);
  const momentumFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Cancel any in-flight momentum animation if the page unmounts mid-coast.
    return () => {
      if (momentumFrameRef.current !== null) cancelAnimationFrame(momentumFrameRef.current);
    };
  }, []);

  function stopMomentum() {
    if (momentumFrameRef.current !== null) {
      cancelAnimationFrame(momentumFrameRef.current);
      momentumFrameRef.current = null;
    }
  }

  function startMomentum(el: HTMLDivElement) {
    const FRICTION = 0.95; // velocity multiplier applied every frame
    const MIN_VELOCITY = 0.02; // px/ms below which we just stop

    function step() {
      velocityRef.current *= FRICTION;

      if (Math.abs(velocityRef.current) < MIN_VELOCITY) {
        momentumFrameRef.current = null;
        return;
      }

      el.scrollLeft += velocityRef.current * 16; // ~16ms per frame at 60fps

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft <= 0 || el.scrollLeft >= maxScroll) {
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
    // Only keep the last ~100ms of samples — this is what makes release
    // velocity reflect the final flick, not the whole drag gesture.
    pointerSamplesRef.current = pointerSamplesRef.current.filter((s) => now - s.t < 100);
  }


function handleDatePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const el = e.currentTarget;

    // Pointer capture redirects ALL pointer events (including this one) to
    // `el`, so e.target here is always the div — never the button beneath
    // the cursor. Release capture and manually resolve the real target.
    el.releasePointerCapture(e.pointerId);

    const totalDistance = Math.abs(e.clientX - dragStartXRef.current);
    const TAP_THRESHOLD = 6; // px — below this, treat as a tap, not a drag

    if (totalDistance < TAP_THRESHOLD) {
      const realTarget = document.elementFromPoint(e.clientX, e.clientY);
      const dayButton = realTarget?.closest<HTMLElement>("[data-day-index]");
      if (dayButton) {
        const index = Number(dayButton.dataset.dayIndex);
        if (!Number.isNaN(index)) {
          setSelectedDayIndex(index);
          setSelectedSlot(null);
        }
      }
    }

    const samples = pointerSamplesRef.current;
    if (samples.length >= 2) {
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = last.t - first.t;
      // Negated: dragging right (+dx) should scroll content left (-scrollLeft direction).
      velocityRef.current = dt > 0 ? -(last.x - first.x) / dt : 0;
    } else {
      velocityRef.current = 0;
    }

    startMomentum(el);
  }
  // ─── Confirm booking ─────────────────────────────────────────
  function handleConfirm() {
    if (!selectedSlot) return;
    // TODO: Replace with a real POST /api/bookings call once the
    // Booking model + endpoint exist. Payload would be:
    // day, hour, coach_id, token.
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setConfirmed(true);
    }, 400);
  }

  // ─── Auth loading ────────────────────────────────────────────
  if (checkingAuth) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gray-950 px-4 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-[#B4E3BD]" />
          <p className="text-sm text-gray-500">{t("checkingAuth")}</p>
        </div>
      </main>
    );
  }

  // ─── Booking confirmed ───────────────────────────────────────
  if (confirmed && selectedSlot) {
    const day = days[selectedDayIndex];

    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gray-950 px-4 py-12 text-white">
        <div className="w-full max-w-md rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-2xl sm:p-8">
          {/* Success icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#B4E3BD]/30 bg-[#B4E3BD]/10">
            <span className="text-2xl font-semibold text-[#B4E3BD]">✓</span>
          </div>

          <div className="text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#B4E3BD]">
              FD CrossFit
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("successTitle")}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-400">
              {t("successMessage")}
            </p>
          </div>

          {/* Booking summary */}
          <div className="mt-8 rounded-2xl border border-gray-800 bg-gray-950 p-5">
            <div className="mb-5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                {t("summaryDate")}
              </p>
              <p className="font-semibold">
                {day.weekday}, {day.dayNum} {day.month}
              </p>
              <p className="mt-1 text-sm text-gray-400">{selectedSlot.hour}:00</p>
            </div>

            <div className="flex items-center gap-3 border-t border-gray-800 pt-5">
              <div className="relative h-11 w-11 overflow-hidden rounded-full ring-1 ring-gray-700">
                <Image
                  src={selectedSlot.coach.image}
                  alt={selectedSlot.coach.name}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                  {t("summaryCoach")}
                </p>
                <p className="mt-0.5 font-semibold">{selectedSlot.coach.name}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-950 px-4 py-12 text-white sm:px-8 sm:py-16">
      <div className="mx-auto max-w-4xl">
        {/* ─── Header ─────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#B4E3BD]" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B4E3BD]">
              FD CrossFit
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        {/* ─── Day picker ─────────────────────────────────────── */}
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#B4E3BD]">
              {t("chooseDay")}
            </h2>
          </div>

          <div
            className="date-scroll flex gap-3 overflow-x-auto pb-1"
            style={{ touchAction: "none" }}
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

              return (
                <button
                  key={day.date.toISOString()}
                  type="button"
                  draggable={false}
                  data-day-index={i}
                  onClick={() => {
                    setSelectedDayIndex(i);
                    setSelectedSlot(null);
                  }}
                  className={`date-card relative flex min-w-[76px] shrink-0 select-none flex-col items-center rounded-2xl border px-4 py-3.5 transition-all duration-200 ${
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
                      {t("today")}
                    </span>
                  )}
                  <span className="text-[11px] font-medium uppercase tracking-wide opacity-70">
                    {day.weekday}
                  </span>
                  <span className="mt-0.5 text-2xl font-bold leading-none">{day.dayNum}</span>
                  <span className="mt-1 text-[11px] opacity-70">{day.month}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── Time slots ─────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#B4E3BD]">
                {t("chooseTime")}
              </h2>
            </div>
            <span className="shrink-0 text-xs text-gray-500">{slots.length} sessions</span>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {slots.map((slot) => {
              const isActive = selectedSlot?.hour === slot.hour;

              return (
                <button
                  key={slot.hour}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`booking-card group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3 text-start ${
                    isActive
                      ? "border-[#B4E3BD] bg-[#B4E3BD]/10 shadow-[0_8px_25px_rgba(180,227,189,0.08)]"
                      : "border-gray-800 bg-gray-900/80 hover:border-[#B4E3BD]/40 hover:bg-gray-800"
                  }`}
                >
                  <div
                    className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-full ${
                      isActive ? "ring-2 ring-[#B4E3BD]" : "ring-1 ring-gray-700"
                    }`}
                  >
                    <Image
                      src={slot.coach.image}
                      alt={slot.coach.name}
                      fill
                      sizes="44px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{slot.hour}:00</p>
                      {isActive && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#B4E3BD]" />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-400">{slot.coach.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── Selected session ───────────────────────────────── */}
        {selectedSlot && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-[#B4E3BD]/20 bg-[#B4E3BD]/5 p-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#B4E3BD]">
                {t("selectedSession")}
              </p>
              <p className="mt-1 truncate font-semibold">
                {days[selectedDayIndex].weekday}, {days[selectedDayIndex].dayNum}{" "}
                {days[selectedDayIndex].month}
              </p>
              <p className="mt-0.5 text-sm text-gray-400">
                {selectedSlot.hour}:00 · {selectedSlot.coach.name}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B4E3BD] text-black">
              ✓
            </div>
          </div>
        )}

        {/* ─── Confirm ────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedSlot || submitting}
          className="w-full rounded-full bg-[#B4E3BD] px-6 py-3.5 font-semibold text-black shadow-[0_8px_30px_rgba(180,227,189,0.12)] transition-all duration-200 hover:bg-white hover:shadow-[0_8px_30px_rgba(255,255,255,0.08)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30 sm:w-auto sm:px-10"
        >
          {submitting ? "..." : t("confirm")}
        </button>
      </div>
    </main>
  );
}