import { useTranslations } from "next-intl";

const COACHES = [
  { name: "Ali Rezaei", role: "Head Coach", specialties: ["Olympic Lifting", "Programming"], emoji: "🏋️" },
  { name: "Sara Ahmadi", role: "Coach", specialties: ["Gymnastics", "Mobility"], emoji: "🤸" },
  { name: "Reza Karimi", role: "Coach", specialties: ["Endurance", "Nutrition"], emoji: "🏃" },
  { name: "Niloofar Hosseini", role: "Coach", specialties: ["Beginner Training", "Rehab"], emoji: "💪" },
];

export default function CoachesPage() {
  const t = useTranslations("coachesPage");

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-20 text-white">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mb-16 text-lg text-gray-400">{t("subtitle")}</p>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {COACHES.map((coach) => (
            <div
              key={coach.name}
              className="rounded-xl bg-gray-800 p-6 text-center transition hover:-translate-y-1 hover:bg-gray-700"
            >
              <div className="mb-4 text-5xl">{coach.emoji}</div>
              <h3 className="text-lg font-semibold">{coach.name}</h3>
              <p className="mb-3 text-sm text-[#B4E3BD]">{coach.role}</p>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {t("specialtiesLabel")}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {coach.specialties.join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}