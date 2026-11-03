
"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useBodyScrollLock } from "./useScrollLock";

/* ─── Event → Competition day mapping ───────────────────────────── */

const EVENT_DAY: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 3,
  5: 3,
  6: 3,
  7: 4,
  8: 4,
};

const ALL_EVENTS = [1, 2, 3 , 4, 5, 6 ,7 ,8 ];

/* ─── Icons ──────────────────────────────────────────────────────── */

function IconX() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 transition-transform duration-300 ${
        open ? "rotate-180 text-[#B4E3BD]" : "text-gray-500"
      }`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5" />
      <path d="M9 10h6M9 14h6" />
    </svg>
  );
}

function IconWorkout() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 9v6M7 6v12M17 6v12M20 9v6M7 12h10" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 4.5A2.5 2.5 0 0 1 5.5 2H10a2 2 0 0 1 2 2v16a2 2 0 0 0-2-2H5.5A2.5 2.5 0 0 0 3 20.5z" />
      <path d="M21 4.5A2.5 2.5 0 0 0 18.5 2H14a2 2 0 0 0-2 2v16a2 2 0 0 1 2-2h4.5a2.5 2.5 0 0 1 2 2.5z" />
    </svg>
  );
}

/* ─── Component ──────────────────────────────────────────────────── */

export type EventsModalProps = {
  open: boolean;
  onClose: () => void;
  onViewRuleBook: (day: number) => void;
};

export default function EventsModal({
  open,
  onClose,
  onViewRuleBook,
}: EventsModalProps) {
  useBodyScrollLock(open);

  const t = useTranslations("competition");
  const locale = useLocale();
  const isRTL = locale === "fa";
  const [openEvent, setOpenEvent] = useState<number | null>(1);

  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-end justify-center
        bg-black/75 backdrop-blur-sm
        sm:items-center sm:p-5
      "
      onClick={onClose}
    >
      <div
        dir={isRTL ? "rtl" : "ltr"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="events-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="
          flex w-full max-w-3xl flex-col
          max-h-[92dvh]
          overflow-hidden
          rounded-t-[2rem]
          border border-white/10
          bg-[#101010]
          shadow-2xl shadow-black/70
          sm:max-h-[min(820px,calc(100dvh-2.5rem))]
          sm:rounded-3xl
        "
      >
        {/* Top accent */}
        <div className="h-1 shrink-0 bg-gradient-to-r from-transparent via-[#B4E3BD] to-transparent" />

        {/* ─── Header ─── */}
        <div className="shrink-0 border-b border-white/[0.06] bg-[#111111] px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#B4E3BD]/20 bg-[#B4E3BD]/10 text-[#B4E3BD]">
                <IconClipboard />
              </div>

              <div className="min-w-0">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B4E3BD]/70">
                  FD CROSSFIT
                </p>

                <h2
                  id="events-modal-title"
                  className="truncate text-lg font-bold tracking-tight text-white sm:text-xl"
                >
                  {t("events.title")}
                </h2>

                <p className="mt-0.5 text-xs leading-relaxed text-gray-500 sm:text-sm">
                  {t("events.subtitle")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close events"
              className="
                flex h-10 w-10 shrink-0 items-center justify-center
                rounded-full border border-white/[0.06]
                text-gray-500 transition
                hover:border-white/10 hover:bg-white/5 hover:text-white
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-[#B4E3BD]/60
              "
            >
              <IconX />
            </button>
          </div>

          {/* Event count */}
          <div className="mt-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/[0.06]" />
            <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-600">
              09 EVENTS
            </span>
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>
        </div>

        {/* ─── Scrollable event list ─── */}
        <div
          className="
            coach-scroll min-h-0 flex-1
            overflow-y-auto overscroll-contain
            px-4 py-4
            sm:px-7 sm:py-5
          "
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="space-y-2.5 pb-3">
            {ALL_EVENTS.map((evNum) => {
              const day = EVENT_DAY[evNum];
              const isOpen = openEvent === evNum;

              // All event content comes from the active locale.
              const description = t.raw(`events.event${evNum}.desc`);
              const workout = t.raw(`events.event${evNum}.workout`);

              return (
                <div
                  key={evNum}
                  className={`
                    overflow-hidden rounded-2xl border
                    transition-colors duration-300
                    ${
                      isOpen
                        ? "border-[#B4E3BD]/25 bg-[#151515] shadow-lg shadow-black/20"
                        : "border-white/[0.08] bg-[#141414] hover:border-white/[0.14]"
                    }
                  `}
                >
                  {/* ─── Event header ─── */}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenEvent((current) =>
                        current === evNum ? null : evNum
                      )
                    }
                    aria-expanded={isOpen}
                    className="
                      flex w-full items-center gap-3
                      p-3.5 text-start transition-colors
                      hover:bg-white/[0.015]
                      sm:gap-4 sm:px-4 sm:py-4
                    "
                  >
                    {/* Event number */}
                    <div
                      className={`
                        flex h-11 w-11 shrink-0 items-center justify-center
                        rounded-xl border text-sm font-black
                        transition-all duration-300
                        sm:h-12 sm:w-12
                        ${
                          isOpen
                            ? "border-[#B4E3BD]/35 bg-[#B4E3BD] text-black shadow-lg shadow-[#B4E3BD]/10"
                            : "border-[#B4E3BD]/20 bg-[#B4E3BD]/[0.07] text-[#B4E3BD]"
                        }
                      `}
                    >
                      {String(evNum).padStart(2, "0")}
                    </div>

                    {/* Event title and workout preview */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-white sm:text-[15px]">
                          Event {evNum}
                        </p>

                        <span className="hidden rounded-full border border-white/[0.08] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-500 sm:inline-flex">
                          {t("events.day")} {day}
                        </span>
                      </div>

                      <span className="mt-1 block text-[10px] text-gray-600 sm:hidden">
                        {t("events.day")} {day}
                      </span>
                    </div>

                    <IconChevron open={isOpen} />
                  </button>

                  {/* ─── Expandable content ─── */}
                  <div
                    className={`
                      grid transition-[grid-template-rows,opacity]
                      duration-300 ease-out
                      ${
                        isOpen
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }
                    `}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="border-t border-white/[0.06] px-4 pb-4 pt-4 sm:px-5 sm:pb-5">

                        {/* ─── Workout card ─── */}
                        {typeof workout === "string" && (
                          <div
                            className="
                              mt-4 overflow-hidden rounded-2xl
                              border border-[#B4E3BD]/15
                              bg-gradient-to-br
                              from-[#B4E3BD]/10 to-transparent
                            "
                          >
                            {/* Workout label */}
                            <div className="flex items-center gap-2 border-b border-[#B4E3BD]/10 px-3.5 py-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#B4E3BD]/10 text-[#B4E3BD]">
                                <IconWorkout />
                              </span>

                              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B4E3BD]/70">
                                Workout
                              </span>
                            </div>

                            {/* Workout information */}
                            <div className="px-3.5 py-3">
                              <p className="whitespace-pre-line text-sm font-semibold leading-relaxed text-white sm:text-base">
                                {workout}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* ─── Footer / Rule Book ─── */}
                        <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2 text-[11px] text-gray-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#B4E3BD]/60" />
                            {t("events.day")} {day}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onViewRuleBook(day);
                            }}
                            className="
                              inline-flex w-full items-center justify-center gap-2
                              rounded-xl border border-[#B4E3BD]/25
                              bg-[#B4E3BD]/10 px-4 py-2.5
                              text-xs font-bold text-[#B4E3BD]
                              transition-all
                              hover:border-[#B4E3BD]/40
                              hover:bg-[#B4E3BD]/20
                              hover:shadow-lg hover:shadow-[#B4E3BD]/5
                              active:scale-[0.98]
                              focus-visible:outline-none
                              focus-visible:ring-2
                              focus-visible:ring-[#B4E3BD]/60
                              sm:w-auto
                            "
                          >
                            <IconBook />
                            {t("events.viewInRuleBook")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile safe area */}
        <div className="h-[env(safe-area-inset-bottom)] shrink-0 bg-[#101010]" />
      </div>
    </div>
  );
}
