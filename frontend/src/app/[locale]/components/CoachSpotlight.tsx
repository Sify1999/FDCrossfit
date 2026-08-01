"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

type Coach = {
  id: string;
  name: string;
  role: string;
  image: string;
};

const COACHES: Coach[] = [
  { id: "ali", name: "Ali", role: "Head Coach", image: "/images/coaches/ali.jpg" },
  { id: "ahmad", name: "Ahmad", role: "Coach", image: "/images/coaches/ahmad.jpg" },
  { id: "arsalan", name: "Arsalan", role: "Coach", image: "/images/coaches/arsalan.jpg" },
  { id: "arvin", name: "Arvin", role: "Coach", image: "/images/coaches/arvin.jpg" },
];

const AUTO_ADVANCE_MS = 4000;

export default function CoachSpotlight() {
  const t = useTranslations("home.coachSpotlight");
  const locale = useLocale();
  const isRTL = locale === "fa";

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const len = COACHES.length;

  const next = useCallback(
    () => setIndex((i) => (i + 1) % len),
    [len]
  );

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + len) % len),
    [len]
  );

  useEffect(() => {
    if (paused) return;

    const id = setInterval(next, AUTO_ADVANCE_MS);

    return () => clearInterval(id);
  }, [paused, next]);

  const active = COACHES[index];

  const prevCoach = COACHES[(index - 1 + len) % len];
  const nextCoach = COACHES[(index + 1) % len];

  const leftCoach = isRTL ? nextCoach : prevCoach;
  const rightCoach = isRTL ? prevCoach : nextCoach;

  const goLeft = () => (isRTL ? next() : prev());
  const goRight = () => (isRTL ? prev() : next());

  const prevArrowFlipped = !isRTL;
  const nextArrowFlipped = isRTL;

  return (
    <section
      className="
      relative
      overflow-hidden
      bg-gradient-to-b
      from-[#050505]
      via-[#0b120c]
      to-black
      px-6
      py-28
      text-white
      sm:px-12
      "
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >

      {/* Top divider */}
      <div className="
        absolute
        top-0
        left-0
        h-px
        w-full
        bg-gradient-to-r
        from-transparent
        via-[#B4E3BD]/50
        to-transparent
      "/>


      {/* Green background glow */}
      <div
        className="
        absolute
        left-1/2
        top-24
        -z-0
        h-80
        w-80
        -translate-x-1/2
        rounded-full
        bg-[#B4E3BD]/10
        blur-3xl
        "
      />


      <div className="relative z-10 mx-auto max-w-4xl text-center">

        <span
          className="
          mb-4
          block
          text-sm
          font-bold
          uppercase
          tracking-wide
          text-[#B4E3BD]
          "
        >
          {t("eyebrow")}
        </span>


        <h2
          className="
          mb-16
          text-4xl
          font-black
          uppercase
          tracking-tight
          sm:text-5xl
          "
        >
          {t("title")}
        </h2>


        {/* Photos */}
        <div
          className="
          mb-10
          flex
          items-center
          justify-center
          gap-8
          sm:gap-24
          "
        >

          <PeekCircle
            coach={leftCoach}
            onClick={goLeft}
            label={t("prev")}
          />


          <div
            className="
            relative
            h-36
            w-36
            shrink-0
            sm:h-44
            sm:w-44
            "
          >

            {COACHES.map((coach, i) => (
              <div
                key={coach.id}
                className={`
                absolute
                inset-0
                rounded-full
                transition-all
                duration-700
                ${
                  i === index
                    ? "scale-100 opacity-100"
                    : "scale-90 opacity-0 pointer-events-none"
                }
                `}
              >

                <div
                  className="
                  h-full
                  w-full
                  overflow-hidden
                  rounded-full
                  ring-4
                  ring-[#B4E3BD]
                  ring-offset-4
                  ring-offset-black
                  shadow-[0_0_60px_-15px_#B4E3BD]
                  "
                >

                  <Image
                    src={coach.image}
                    alt={coach.name}
                    width={200}
                    height={200}
                    className="h-full w-full object-cover"
                  />

                </div>

              </div>
            ))}

          </div>


          <PeekCircle
            coach={rightCoach}
            onClick={goRight}
            label={t("next")}
          />

        </div>


        {/* Coach info */}

        <div
          key={active.id}
          className="animate-[fadeIn_0.5s_ease-out]"
        >

          <h3 className="
          text-2xl
          font-bold
          ">
            {active.name}
          </h3>


          <p className="
          mb-5
          text-sm
          font-semibold
          uppercase
          tracking-widest
          text-[#B4E3BD]
          ">
            {active.role}
          </p>


          <p className="
          mx-auto
          max-w-md
          text-gray-400
          leading-relaxed
          ">
            {t(`notes.${active.id}`)}
          </p>

        </div>


        {/* Controls */}

        <div
          className="
          mt-12
          flex
          items-center
          justify-center
          gap-6
          "
        >

          <button
            onClick={prev}
            aria-label={t("prev")}
            className="
            rounded-full
            border
            border-white/20
            p-3
            transition
            hover:border-[#B4E3BD]
            hover:text-[#B4E3BD]
            "
          >
            <ArrowIcon flipped={prevArrowFlipped}/>
          </button>


          <div className="flex gap-2">

            {COACHES.map((coach,i)=>(
              <button
                key={coach.id}
                onClick={()=>setIndex(i)}
                aria-label={coach.name}
                className={`
                h-2
                rounded-full
                transition-all
                ${
                  i===index
                  ?"w-8 bg-[#B4E3BD]"
                  :"w-2 bg-white/20"
                }
                `}
              />
            ))}

          </div>


          <button
            onClick={next}
            aria-label={t("next")}
            className="
            rounded-full
            border
            border-white/20
            p-3
            transition
            hover:border-[#B4E3BD]
            hover:text-[#B4E3BD]
            "
          >
            <ArrowIcon flipped={nextArrowFlipped}/>
          </button>

        </div>


      </div>

    </section>
  );
}



function PeekCircle({
  coach,
  onClick,
  label,
}:{
  coach:Coach;
  onClick:()=>void;
  label:string;
}){

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="
      h-16
      w-16
      shrink-0
      overflow-hidden
      rounded-full
      opacity-40
      grayscale
      transition-all
      duration-300
      hover:opacity-80
      hover:grayscale-0
      sm:h-28
      sm:w-28
      "
    >

      <Image
        src={coach.image}
        alt=""
        width={120}
        height={120}
        className="h-full w-full object-cover"
      />

    </button>
  );
}



function ArrowIcon({
  flipped=false
}:{
  flipped?:boolean;
}){

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={flipped ? "rotate-180" : ""}
    >

      <path
        d="M5 12h14M13 6l6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

    </svg>
  );
}