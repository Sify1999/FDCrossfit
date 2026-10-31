
"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

type CoachId = "ali" | "ahmad" | "arsalan" | "arvin" | "kimia" | "behnood";

const COACHES: {
  id: CoachId;
  name: string;
  role: string;
  specialties?: string[];
  image: string;
}[] = [
  {
    id: "ali",
    name: "Ali",
    role: "Coach",
    specialties: ["Olympic Lifting", "Programming"],
    image: "/images/coaches/ali.PNG",
  },
  {
    id: "arsalan",
    name: "Arsalan",
    role: "Coach",
    image: "/images/coaches/arsalan.PNG",
  },
  {
    id: "ahmad",
    name: "Ahmad",
    role: "Coach",
    image: "/images/coaches/ahmad.PNG",
  },
  {
    id: "arvin",
    name: "Arvin",
    role: "Coach",
    image: "/images/coaches/arvin.PNG",
  },
  {
    id: "behnood",
    name: "Behnood",
    role: "Coach",
    image: "/images/coaches/behnood.PNG",
  },
  {
    id: "kimia",
    name: "Kimia",
    role: "Coach",
    image: "/images/coaches/kimia.PNG",
  },
];

export default function CoachesPage() {
  const t = useTranslations("coachesPage");

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-20 text-white">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>

        <p className="mb-16 text-lg text-gray-400">
          {t("subtitle")}
        </p>

        <div className="grid justify-items-center gap-6 sm:grid-cols-2 sm:justify-items-stretch lg:grid-cols-4">
          {COACHES.map((coach) => (
            <div
              key={coach.id}
              className="
                relative aspect-[3/4] w-full max-w-[340px]
                overflow-hidden rounded-2xl
                border-2 border-[#B4E3BD]/20 bg-gray-900
                shadow-[0_8px_25px_-8px_rgba(180,227,189,0.15)]
                transition-all duration-300
                hover:-translate-y-1
                hover:border-[#B4E3BD]
                hover:shadow-[0_12px_35px_-8px_rgba(180,227,189,0.35)]
                sm:max-w-none
              "
            >
              {/* Coach Photo */}
              <Image
                src={coach.image}
                alt={coach.name}
                fill
                className="object-cover object-top"
              />

              {/* Bottom Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              {/* Coach Information */}
              <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                <h3 className="text-base font-semibold sm:text-lg">
                  {coach.name}
                </h3>

                <p className="mb-2 text-xs text-[#B4E3BD] sm:text-sm">
                  {coach.role}
                </p>

                {/* Specialties — Ali only */}
                {coach.id === "ali" && coach.specialties && (
                  <>
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 sm:text-xs">
                      {t("specialtiesLabel")}
                    </p>

                    <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                      {coach.specialties.join(" · ")}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
