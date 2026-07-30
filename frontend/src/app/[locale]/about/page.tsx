import { useTranslations } from "next-intl";

export default function AboutPage() {
  const t = useTranslations("aboutPage");

  const values = [
    { title: t("value1Title"), text: t("value1"), icon: "🤝" },
    { title: t("value2Title"), text: t("value2"), icon: "🎯" },
    { title: t("value3Title"), text: t("value3"), icon: "📈" },
  ];

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <section className="px-4 py-20 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-400">{t("intro")}</p>
      </section>

      <section className="bg-gray-900 px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#B4E3BD]">
            {t("missionTitle")}
          </h2>
          <p className="text-lg leading-relaxed text-gray-400">{t("mission")}</p>
        </div>
      </section>

      <section className="px-4 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">
          {t("valuesTitle")}
        </h2>
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-xl bg-gray-800 p-6 text-center transition hover:-translate-y-1 hover:bg-gray-700"
            >
              <div className="mb-4 text-4xl">{v.icon}</div>
              <h3 className="mb-2 text-xl font-semibold text-[#B4E3BD]">
                {v.title}
              </h3>
              <p className="text-gray-400">{v.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}