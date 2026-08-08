"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

// ─── Data ─────────────────────────────────────────────────────────────

type SuccessStory = {
  id: string;
  beforeImage: string;
  afterImage: string;
  stat1Value: string;
  stat2Value: string;
};

const SUCCESS_STORIES: SuccessStory[] = [
  {
    id: "person1",
    beforeImage: "/images/success-stories/testimg.png",
    afterImage: "/images/success-stories/testimg.png",
    stat1Value: "6kg",
    stat2Value: "2.5x",
  },
  {
    id: "person2",
    beforeImage: "/images/success-stories/testimg.png",
    afterImage: "/images/success-stories/testimg.png",
    stat1Value: "9kg",
    stat2Value: "3x",
  },
  {
    id: "person3",
    beforeImage: "/images/success-stories/testimg.png",
    afterImage: "/images/success-stories/testimg.png",
    stat1Value: "12kg",
    stat2Value: "40%",
  },
];

type Testimonial = {
  id: string;
  image: string;
};

const TESTIMONIALS: Testimonial[] = [
  { id: "member1", image: "/images/testimonials/testimg.png" },
  { id: "member2", image: "/images/testimonials/testimg.png" },
  { id: "member3", image: "/images/testimonials/testimg.png" },
  { id: "member4", image: "/images/testimonials/testimg.png" },
];

// ─── Shared drag-to-slide carousel hook ────────────────────────────────
// Same pattern as GymGallery: a ref (not state) tracks where the drag
// started so pointerup always reads the value from pointerdown, never a
// stale one. isRTL flips which direction "forward" drags toward, exactly
// like GymGallery's next()/previous() branching.

function useDragCarousel(length: number, isRTL: boolean) {
  const [index, setIndex] = useState(0);
  const dragStart = useRef<number | null>(null);

  function next() {
    setIndex((i) => (i + 1) % length);
  }

  function prev() {
    setIndex((i) => (i - 1 + length) % length);
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragStart.current = e.clientX;
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (dragStart.current === null) return;

    const distance = dragStart.current - e.clientX;

    // Minimum movement required to prevent accidental slides.
    if (isRTL) {
      if (distance > 50) prev();
      if (distance < -50) next();
    } else {
      if (distance > 50) next();
      if (distance < -50) prev();
    }

    dragStart.current = null;
  }

  return { index, setIndex, next, prev, handlePointerDown, handlePointerUp };
}

function CarouselDots({
  count,
  activeIndex,
  onSelect,
  label,
}: {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  label: string;
}) {
  return (
    <div className="mt-6 flex justify-center gap-2 sm:hidden">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`${label} ${i + 1}`}
          aria-current={i === activeIndex}
          className={`h-2 rounded-full transition-all motion-reduce:transition-none ${
            i === activeIndex ? "w-8 bg-[#91C78C]" : "w-2 bg-white/20"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Icons ──────────────────────────────────────────────────────────────

function TrendUpIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 7 13.5 15.5 8.5 10.5 2 17" />
      <path d="M16 7h6v6" />
    </svg>
  );
}

function QuoteMark() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      className="text-[#91C78C]"
      aria-hidden="true"
    >
      <path
        d="M7.17 6C4.87 8.1 3.5 10.85 3.5 14.03c0 3.31 2.25 5.47 5.02 5.47 2.4 0 4.2-1.85 4.2-4.2 0-2.2-1.6-3.9-3.7-3.9-.3 0-.6.03-.87.1.35-2.1 1.85-4.15 3.85-5.5L7.17 6Zm10.13 0c-2.3 2.1-3.67 4.85-3.67 8.03 0 3.31 2.25 5.47 5.02 5.47 2.4 0 4.2-1.85 4.2-4.2 0-2.2-1.6-3.9-3.7-3.9-.3 0-.6.03-.87.1.35-2.1 1.85-4.15 3.85-5.5L17.3 6Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ─── Success story card ─────────────────────────────────────────────────

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <TrendUpIcon className="text-[#91C78C]" />
        <p className="text-xl font-black text-[#91C78C]">{value}</p>
      </div>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
    </div>
  );
}

function SuccessStoryCard({ story }: { story: SuccessStory }) {
  const t = useTranslations("successStories");

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-lg shadow-black/30">
      {/* Before / after image pair */}
      <div className="relative grid grid-cols-2">
        <div className="relative aspect-[3/4]">
          <Image
            src={story.beforeImage}
            alt={t(`stories.${story.id}.name`)}
            fill
            draggable={false}
            sizes="(max-width: 640px) 45vw, 200px"
            className="pointer-events-none select-none object-cover"
          />
          <span className="absolute bottom-2 start-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            {t("beforeLabel")}
          </span>
        </div>
        <div className="relative aspect-[3/4]">
          <Image
            src={story.afterImage}
            alt={t(`stories.${story.id}.name`)}
            fill
            draggable={false}
            sizes="(max-width: 640px) 45vw, 200px"
            className="pointer-events-none select-none object-cover"
          />
          <span className="absolute bottom-2 end-2 rounded-md bg-[#91C78C] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-black">
            {t("afterLabel")}
          </span>
        </div>

        {/* Duration badge */}
        <span className="absolute top-2 start-2 end-2 mx-auto w-fit rounded-full border border-[#91C78C]/40 bg-black/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#91C78C]">
          {t(`stories.${story.id}.duration`)}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <QuoteMark />
        <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-300">
          {t(`stories.${story.id}.quote`)}
        </p>
        <p className="mt-4 font-semibold text-white">{t(`stories.${story.id}.name`)}</p>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
          <StatItem value={story.stat1Value} label={t(`stories.${story.id}.stat1Label`)} />
          <StatItem value={story.stat2Value} label={t(`stories.${story.id}.stat2Label`)} />
        </div>
      </div>
    </div>
  );
}

// ─── Testimonial card ────────────────────────────────────────────────────

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const t = useTranslations("successStories.testimonials");

  return (
    <div className="flex h-full w-full flex-col rounded-2xl border border-white/10 bg-[#141414] p-8 shadow-lg shadow-black/30">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#91C78C]" aria-hidden="true">
        <path
          d="M7.17 6C4.87 8.1 3.5 10.85 3.5 14.03c0 3.31 2.25 5.47 5.02 5.47 2.4 0 4.2-1.85 4.2-4.2 0-2.2-1.6-3.9-3.7-3.9-.3 0-.6.03-.87.1.35-2.1 1.85-4.15 3.85-5.5L7.17 6Zm10.13 0c-2.3 2.1-3.67 4.85-3.67 8.03 0 3.31 2.25 5.47 5.02 5.47 2.4 0 4.2-1.85 4.2-4.2 0-2.2-1.6-3.9-3.7-3.9-.3 0-.6.03-.87.1.35-2.1 1.85-4.15 3.85-5.5L17.3 6Z"
          fill="currentColor"
        />
      </svg>

      <p className="mt-4 flex-1 leading-relaxed text-gray-300">
        {t(`items.${testimonial.id}.quote`)}
      </p>

      <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-6">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-[#91C78C]/40">
          <Image
            src={testimonial.image}
            alt={t(`items.${testimonial.id}.name`)}
            fill
            draggable={false}
            sizes="48px"
            className="pointer-events-none select-none object-cover"
          />
        </div>
        <div>
          <p className="font-semibold text-white">{t(`items.${testimonial.id}.name`)}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#91C78C]">
            {t("memberLabel")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────

export default function SuccessStories() {
  const t = useTranslations("successStories");
  const locale = useLocale();
  const isRTL = locale === "fa";

  const storiesCarousel = useDragCarousel(SUCCESS_STORIES.length, isRTL);
  const testimonialsCarousel = useDragCarousel(TESTIMONIALS.length, isRTL);

  const activeStory = SUCCESS_STORIES[storiesCarousel.index];
  const activeTestimonial = TESTIMONIALS[testimonialsCarousel.index];

  return (
    <>
      {/* ─── Success Stories ────────────────────────────────────────── */}
      <section className="bg-black px-6 py-24 text-white sm:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start">
            {/* Intro */}
            <div>
              <span className="mb-4 block text-sm font-bold uppercase tracking-wide text-[#91C78C]">
                {t("eyebrow")}
              </span>
              <h2 className="mb-5 text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
                {t("title")}
              </h2>
              <p className="leading-relaxed text-gray-400">{t("description")}</p>
            </div>

            {/* Desktop grid */}
            <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
              {SUCCESS_STORIES.map((story) => (
                <SuccessStoryCard key={story.id} story={story} />
              ))}
            </div>

            {/* Mobile — drag/swipe carousel, same pointer-drag rule as GymGallery */}
            <div className="sm:hidden">
              <div
                role="region"
                aria-label={t("title")}
                className="cursor-grab select-none active:cursor-grabbing"
                style={{ touchAction: "none" }}
                onPointerDown={storiesCarousel.handlePointerDown}
                onPointerUp={storiesCarousel.handlePointerUp}
              >
                <div key={activeStory.id} className="animate-[fadeIn_0.4s_ease-out]">
                  <SuccessStoryCard story={activeStory} />
                </div>
              </div>
              <CarouselDots
                count={SUCCESS_STORIES.length}
                activeIndex={storiesCarousel.index}
                onSelect={storiesCarousel.setIndex}
                label={t("title")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0a0a] px-6 py-24 text-white sm:px-12">
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
          <Image src="/images/gym/gym2.png" alt="" fill className="object-cover" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <span className="mb-4 block text-sm font-bold uppercase tracking-wide text-[#91C78C]">
              {t("testimonials.eyebrow")}
            </span>
            <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
              {t("testimonials.title")}
            </h2>
          </div>

          {/* Desktop grid */}
          <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>

          {/* Mobile — drag/swipe carousel */}
          <div className="sm:hidden">
            <div
              role="region"
              aria-label={t("testimonials.title")}
              className="cursor-grab select-none active:cursor-grabbing"
              style={{ touchAction: "none" }}
              onPointerDown={testimonialsCarousel.handlePointerDown}
              onPointerUp={testimonialsCarousel.handlePointerUp}
            >
              <div key={activeTestimonial.id} className="animate-[fadeIn_0.4s_ease-out]">
                <TestimonialCard testimonial={activeTestimonial} />
              </div>
            </div>
            <CarouselDots
              count={TESTIMONIALS.length}
              activeIndex={testimonialsCarousel.index}
              onSelect={testimonialsCarousel.setIndex}
              label={t("testimonials.title")}
            />
          </div>
        </div>
      </section>
    </>
  );
}