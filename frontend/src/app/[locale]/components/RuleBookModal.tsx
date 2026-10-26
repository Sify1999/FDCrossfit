"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useBodyScrollLock } from "./useScrollLock";
import { COMPETITION_DAY_EVENT_GROUPS, eventLabel } from "@/lib/competition-events";
import { dayDateLabel } from "@/lib/competition-days";

/* ─── Rule book chapters ─────────────────────────────────────────────
   Every chapter is one section inside the popup. The four day chapters
   (day: 1..4) are the targets the day cards on the competition page
   scroll to when they open the rule book. */
type RuleChapter = {
  id: string;
  day?: number;
  titleKey: string;
  bodyKey: string;
};

const CHAPTERS: RuleChapter[] = [
  { id: "rules-general", titleKey: "ruleBook.chapters.general.title", bodyKey: "ruleBook.chapters.general.body" },
  { id: "rules-day-1", day: 1, titleKey: "ruleBook.chapters.day1.title", bodyKey: "ruleBook.chapters.day1.body" },
  { id: "rules-day-2", day: 2, titleKey: "ruleBook.chapters.day2.title", bodyKey: "ruleBook.chapters.day2.body" },
  { id: "rules-day-3", day: 3, titleKey: "ruleBook.chapters.day3.title", bodyKey: "ruleBook.chapters.day3.body" },
  { id: "rules-day-4", day: 4, titleKey: "ruleBook.chapters.day4.title", bodyKey: "ruleBook.chapters.day4.body" },
  { id: "rules-scoring", titleKey: "ruleBook.chapters.scoring.title", bodyKey: "ruleBook.chapters.scoring.body" },
  { id: "rules-judging", titleKey: "ruleBook.chapters.judging.title", bodyKey: "ruleBook.chapters.judging.body" },
  { id: "rules-safety", titleKey: "ruleBook.chapters.safety.title", bodyKey: "ruleBook.chapters.safety.body" },
];

/* ─── Icons (inline, currentColor so they inherit) ─────────────────── */
function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconArrowUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

/* ─── Chapter card (memoized) ─────────────────────────────────────────
   Only re-renders when ITS isActive flips, so scrolling never re-renders
   the whole list. All translated content is precomputed in the parent. */
type ChapterData = {
  id: string;
  index: number;
  title: string;
  body: string[];
  dateLabel: string | null;
  events: string[];
};

const ChapterCard = memo(function ChapterCard({
  data,
  isActive,
  registerRef,
}: {
  data: ChapterData;
  isActive: boolean;
  registerRef: (id: string, el: HTMLElement | null) => void;
}) {
  return (
    <section
      id={data.id}
      ref={(el) => registerRef(data.id, el)}
      className={`rounded-2xl border p-5 transition-colors duration-300 sm:p-6 ${
        isActive
          ? "border-[#B4E3BD]/40 bg-[#181818]"
          : "border-white/10 bg-[#141414]"
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <span
          aria-hidden
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-black tabular-nums transition-colors duration-300 ${
            isActive
              ? "border-[#B4E3BD] bg-[#B4E3BD] text-black"
              : "border-[#B4E3BD]/25 bg-[#B4E3BD]/10 text-[#B4E3BD]"
          }`}
        >
          {String(data.index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-snug text-white sm:text-lg">{data.title}</h3>

          {data.dateLabel && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#B4E3BD]/80 sm:text-xs">
              <IconCalendar />
              {data.dateLabel}
            </p>
          )}

          {data.events.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {data.events.map((ev) => (
                <span
                  key={ev}
                  className="rounded-full border border-[#B4E3BD]/20 bg-[#B4E3BD]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#B4E3BD] sm:text-[11px]"
                >
                  {ev}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <ul className="mt-5 space-y-3 border-t border-white/5 pt-5">
        {data.body.map((item, bi) => (
          <li key={bi} className="flex items-start gap-3 text-sm leading-relaxed text-gray-300 sm:text-[15px]">
            <span
              aria-hidden
              className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#B4E3BD]/30 bg-[#B4E3BD]/10 text-[#B4E3BD]"
            >
              <IconCheck />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
});

type Props = {
  open: boolean;
  onClose: () => void;
  /** The day card that was tapped — its chapter is scrolled to on open. */
  targetDay: number;
};

export default function RuleBookModal({ open, onClose, targetDay }: Props) {
  useBodyScrollLock(open);

  const t = useTranslations("competition");
  const locale = useLocale();
  const isRTL = locale === "fa";

  const bodyRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const navScrollRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Cached layout — measured once (and on resize), NOT on every scroll tick.
  const topsRef = useRef<number[]>([]);
  const navHeightRef = useRef(0);

  // While a click-initiated scroll is running, the scroll-spy must not
  // overwrite the chapter the user just picked.
  const lockRef = useRef(false);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const [activeId, setActiveId] = useState<string>(CHAPTERS[0].id);
  const [showTop, setShowTop] = useState(false);

  /* ─── Precomputed, translated chapter data (stable between scrolls) ── */
  const chapterData = useMemo<ChapterData[]>(
    () =>
      CHAPTERS.map((ch, index) => ({
        id: ch.id,
        index,
        title: t(ch.titleKey),
        body: (t.raw(ch.bodyKey) as string[] | undefined) ?? [],
        dateLabel: ch.day ? dayDateLabel(ch.day, locale as "en" | "fa") : null,
        events: ch.day ? (COMPETITION_DAY_EVENT_GROUPS[ch.day] ?? []).map((ev) => eventLabel(ev)) : [],
      })),
    [t, locale]
  );

  const registerRef = useCallback((id: string, el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  }, []);

  /* ─── Layout measuring (once + on resize) ────────────────────────── */
  const measure = useCallback(() => {
    const body = bodyRef.current;
    if (!body) return;
    const bodyTop = body.getBoundingClientRect().top;
    topsRef.current = CHAPTERS.map((ch) => {
      const el = sectionRefs.current[ch.id];
      return el ? el.getBoundingClientRect().top - bodyTop + body.scrollTop : 0;
    });
    navHeightRef.current = navRef.current?.offsetHeight ?? 0;
  }, []);

  /* ─── Scroll helpers ─────────────────────────────────────────────── */
  function engageLock(ms: number) {
    lockRef.current = true;
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => {
      lockRef.current = false;
    }, ms);
  }

  // Scrolls ONLY the modal body (never the page behind it), landing the
  // chapter title right below the sticky nav.
  const scrollToChapter = useCallback(
    (id: string, behavior: ScrollBehavior = "smooth") => {
      const body = bodyRef.current;
      if (!body) return;
      const idx = CHAPTERS.findIndex((c) => c.id === id);
      if (idx < 0) return;

      if (topsRef.current.length === 0) measure();

      setActiveId(id);
      engageLock(behavior === "smooth" ? 650 : 80);
      body.scrollTo({
        top: Math.max(0, topsRef.current[idx] - navHeightRef.current - 8),
        behavior,
      });
    },
    [measure]
  );

  function scrollToTop() {
    const body = bodyRef.current;
    if (!body) return;
    engageLock(650);
    setActiveId(CHAPTERS[0].id);
    body.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ─── Scroll-spy + progress (rAF-throttled, no layout reads) ─────── */
  function computeScrollState() {
    rafRef.current = null;
    const body = bodyRef.current;
    if (!body) return;

    const scrollTop = body.scrollTop;
    const max = body.scrollHeight - body.clientHeight;

    // Progress bar is driven straight on the DOM — no React re-render.
    if (progressRef.current) {
      const p = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
      progressRef.current.style.transform = `scaleX(${p})`;
    }

    setShowTop(scrollTop > 320); // bails out automatically when unchanged

    if (lockRef.current) return;

    const line = scrollTop + navHeightRef.current + 32;
    const tops = topsRef.current;
    let currentIdx = 0;
    for (let i = 0; i < tops.length; i++) {
      if (tops[i] <= line) currentIdx = i;
    }
    // Last chapters can't always reach the top — at the very bottom, the last one wins.
    if (max > 0 && scrollTop >= max - 4) currentIdx = CHAPTERS.length - 1;

    const nextId = CHAPTERS[currentIdx].id;
    setActiveId((prev) => (prev === nextId ? prev : nextId));
  }

  function handleBodyScroll() {
    // Keep the lock alive while a smooth scroll is still moving.
    if (lockRef.current) engageLock(140);
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(computeScrollState);
  }

  /* ─── Keep the active pill visible inside the horizontal nav ─────── */
  useEffect(() => {
    if (!open) return;
    const scroller = navScrollRef.current;
    const pill = pillRefs.current[activeId];
    if (!scroller || !pill) return;

    const s = scroller.getBoundingClientRect();
    const p = pill.getBoundingClientRect();
    const delta = p.left + p.width / 2 - (s.left + s.width / 2);
    // Works in both LTR and RTL because it only uses relative deltas.
    scroller.scrollTo({ left: scroller.scrollLeft + delta, behavior: "smooth" });
  }, [activeId, open]);

  /* ─── Open: measure, then jump straight to the tapped day ────────── */
  useEffect(() => {
    if (!open) return;
    const targeted = CHAPTERS.find((c) => c.day === targetDay) ?? CHAPTERS[0];
    setActiveId(targeted.id);
    setShowTop(false);
    if (progressRef.current) progressRef.current.style.transform = "scaleX(0)";

    // Wait a frame so the overlay is mounted and laid out.
    const frame = requestAnimationFrame(() => {
      measure();
      scrollToChapter(targeted.id, "auto");
      closeBtnRef.current?.focus({ preventScroll: true });
      computeScrollState();
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, targetDay, scrollToChapter, measure]);

  /* ─── Re-measure only when sizes change (resize / content reflow) ── */
  useEffect(() => {
    if (!open) return;
    const content = contentRef.current;
    const body = bodyRef.current;
    if (!content || !body || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => measure());
    ro.observe(content);
    ro.observe(body);
    return () => ro.disconnect();
  }, [open, measure]);

  /* ─── Close on Escape ────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  /* ─── Cleanup timers ─────────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!open) return null;

  const activeIndex = CHAPTERS.findIndex((c) => c.id === activeId);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rule-book-title"
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-gray-800 bg-[#0f0f0f] shadow-2xl shadow-black/60 sm:h-auto sm:max-h-[90vh] sm:rounded-3xl"
      >
        {/* Top accent line (matches the other modals) */}
        <span aria-hidden className="h-px shrink-0 bg-gradient-to-r from-transparent via-[#B4E3BD]/60 to-transparent" />

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-4 pt-5 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#B4E3BD]/25 bg-[#B4E3BD]/10 text-[#B4E3BD]">
              <IconBook />
            </div>
            <div className="min-w-0">
              <h2 id="rule-book-title" className="truncate text-lg font-bold text-white sm:text-xl">
                {t("ruleBook.modal.title")}
              </h2>
              <p className="mt-0.5 truncate text-xs text-gray-500 sm:text-sm">{t("ruleBook.modal.subtitle")}</p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={isRTL ? "بستن کتاب قوانین" : "Close rule book"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4E3BD]/60"
          >
            <IconX />
          </button>
        </div>

        {/* Reading progress (updated via ref, no re-render) */}
        <div aria-hidden className="h-0.5 w-full shrink-0 bg-white/5">
          <div
            ref={progressRef}
            className="h-full origin-left bg-[#B4E3BD] will-change-transform rtl:origin-right"
            style={{ transform: "scaleX(0)" }}
          />
        </div>

        {/* Body (the ONLY scroll container) */}
        <div
          ref={bodyRef}
          onScroll={handleBodyScroll}
          className="coach-scroll relative min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {/* Sticky chapter navigation — solid bg (no backdrop blur) for smooth scrolling */}
          <nav
            ref={navRef}
            aria-label={t("ruleBook.jumpTo")}
            className="sticky top-0 z-10 border-b border-white/5 bg-[#0f0f0f] px-5 py-3 sm:px-7"
          >
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              {t("ruleBook.jumpTo")}
            </p>
            <div
              ref={navScrollRef}
              className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {CHAPTERS.map((ch, i) => {
                const isActive = activeId === ch.id;
                const label = ch.day ? `${t("schedule.day")} ${ch.day}` : chapterData[i].title;
                return (
                  <button
                    key={ch.id}
                    ref={(el) => {
                      pillRefs.current[ch.id] = el;
                    }}
                    type="button"
                    onClick={() => scrollToChapter(ch.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4E3BD]/50 sm:text-xs ${
                      isActive
                        ? "border-[#B4E3BD] bg-[#B4E3BD] text-black"
                        : "border-white/10 bg-white/[0.04] text-gray-300 hover:border-[#B4E3BD]/50 hover:bg-[#B4E3BD]/10 hover:text-white"
                    }`}
                  >
                    <span className={`text-[9px] font-black tabular-nums ${isActive ? "text-black/60" : "text-[#B4E3BD]/80"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Chapters */}
          <div ref={contentRef} className="space-y-4 px-4 py-5 sm:space-y-5 sm:px-7 sm:py-7">
            {chapterData.map((data) => (
              <ChapterCard
                key={data.id}
                data={data}
                isActive={activeId === data.id}
                registerRef={registerRef}
              />
            ))}
          </div>
        </div>

        {/* Floating back-to-top */}
        <button
          type="button"
          onClick={scrollToTop}
          aria-label={isRTL ? "بازگشت به بالا" : "Back to top"}
          tabIndex={showTop ? 0 : -1}
          className={`absolute bottom-20 end-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#B4E3BD]/40 bg-[#0d0d0d] text-[#B4E3BD] shadow-lg shadow-black/50 transition-[opacity,transform,background-color,color] duration-300 hover:bg-[#B4E3BD] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4E3BD]/60 sm:end-7 ${
            showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
          }`}
        >
          <IconArrowUp />
        </button>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-800 px-5 py-4 sm:px-7">
          <span className="text-[11px] font-semibold tabular-nums text-gray-500">
            {String(activeIndex + 1).padStart(2, "0")} / {String(CHAPTERS.length).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-800 px-5 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4E3BD]/50"
          >
            {isRTL ? "بستن" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}