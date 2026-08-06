"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

type CoachId = "ali" | "ahmad" | "arsalan" | "arvin";

const COACHES: {
  id: CoachId;
  name: string;
  role: string;
  specialties: string[];
  image: string;
}[] = [
  {
    id: "ali",
    name: "Ali Ghasemi",
    role: "Head Coach",
    specialties: ["Olympic Lifting", "Programming"],
    image: "/images/coaches/ali.jpg",
  },
  {
    id: "arsalan",
    name: "Arsalan",
    role: "Coach",
    specialties: ["Endurance", "Nutrition"],
    image: "/images/coaches/arsalan.jpg",
  },
  {
    id: "ahmad",
    name: "Ahmad",
    role: "Coach",
    specialties: ["Gymnastics", "Mobility"],
    image: "/images/coaches/ahmad.jpg",
  },
  {
    id: "arvin",
    name: "Arvin",
    role: "Coach",
    specialties: ["Beginner Training", "Rehab"],
    image: "/images/coaches/arvin.jpg",
  },
];

export default function CoachesPage() {
  const t = useTranslations("coachesPage");
  const tNotes = useTranslations("home.coachSpotlight.notes");

  const [openId, setOpenId] = useState<CoachId | null>(null);

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-20 text-white">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mb-16 text-lg text-gray-400">{t("subtitle")}</p>

        <div className="grid justify-items-center gap-6 sm:grid-cols-2 sm:justify-items-stretch lg:grid-cols-4">
          {COACHES.map((coach) => {
            const isOpen = openId === coach.id;

            return (
              <div
                key={coach.id}
                className="
                relative w-full max-w-[340px] aspect-[3/4] sm:max-w-none
                overflow-hidden rounded-2xl
                border-2 border-[#B4E3BD]/20 bg-gray-900
                shadow-[0_8px_25px_-8px_rgba(180,227,189,0.15)]
                transition-all duration-300
                hover:-translate-y-1 hover:border-[#B4E3BD]
                hover:shadow-[0_12px_35px_-8px_rgba(180,227,189,0.35)]
                "
                onClick={() => setOpenId(isOpen ? null : coach.id)}
                aria-expanded={isOpen}
              >
                {/* Photo */}
                <Image
                  src={coach.image}
                  alt={coach.name}
                  fill
                  className="object-cover"
                />

                {/* Base gradient so text is always readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Bottom info bar — click to expand */}
                <button
                  onClick={() => setOpenId(isOpen ? null : coach.id)}
                  aria-expanded={isOpen}
                  className="absolute inset-x-0 bottom-0 p-4 text-left"
                >
                  <h3 className="text-base font-semibold sm:text-lg">{coach.name}</h3>
                  <p className="mb-2 text-xs text-[#B4E3BD] sm:text-sm">{coach.role}</p>
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 sm:text-xs">
                    {t("specialtiesLabel")}
                  </p>
                  <p className="mt-1 mb-2 text-xs text-gray-400 sm:text-sm">
                    {coach.specialties.join(" · ")}
                  </p>
                  <p className="text-[10px] italic text-gray-500 underline decoration-[#B4E3BD]/40 underline-offset-4 sm:text-xs">
                    {t("readMore")}
                  </p>
                </button>

                {/* Expanded overlay */}
                <div
                  dir="ltr"
                  className={`
                  absolute inset-x-0 bottom-0 flex flex-col
                  rounded-t-2xl border-t border-[#B4E3BD]/30
                  bg-black/75 backdrop-blur-sm
                  transition-all duration-400 ease-out
                  ${isOpen ? "h-[75%] opacity-100" : "pointer-events-none h-0 opacity-0"}
                  `}
                >
                  <div className="flex items-start justify-between px-4 pt-5">
                    <div>
                      <h3 className="text-2xl font-semibold sm:text-lg">{coach.name}</h3>
                      <p className="text-lg text-[#B4E3BD] sm:text-sm">{coach.role}</p>
                    </div>
                    <button
                      onClick={() => setOpenId(null)}
                      aria-label={t("close")}
                      className="rounded-full border border-white/20 p-1.5 text-gray-400 transition hover:border-[#B4E3BD] hover:text-[#B4E3BD]"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-2 flex-1 overflow-y-auto px-4 pb-4 coach-scroll">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 sm:text-xs">
                      {t("specialtiesLabel")}
                    </p>
                    <p className="mb-3 mt-1 text-sm text-gray-300 sm:text-sm">
                      {coach.specialties.join(" · ")}
                    </p>
                    <p className="text-sm italic leading-relaxed text-[#B4E3BD]/90 sm:text-sm">
                      {tNotes(coach.id)}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-gray-300 sm:text-sm">
                      {t(`bios.${coach.id}`)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}