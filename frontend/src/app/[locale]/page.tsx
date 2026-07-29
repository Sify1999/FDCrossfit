import { useTranslations } from "next-intl";
import Link from "next/link";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
          {t("hero.title")}
        </h1>
        <p className="mb-8 max-w-xl text-lg text-gray-400">
          {t("hero.subtitle")}
        </p>
        <Link
          href="/auth/register"
          className="rounded-full bg-red-600 px-8 py-3 text-lg font-semibold transition hover:bg-red-700"
        >
          {t("hero.cta")}
        </Link>
      </section>

      {/* ─── About Section ────────────────────────────────────────── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold">{t("about.title")}</h2>
          <p className="text-lg leading-relaxed text-gray-400">
            {t("about.description")}
          </p>
        </div>
      </section>

      {/* ─── Features Section ──────────────────────────────────────── */}
      <section className="bg-gray-900 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            {t("features.title")}
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl bg-gray-800 p-6 text-center">
              <div className="mb-4 text-4xl">🏋️</div>
              <h3 className="mb-2 text-xl font-semibold">
                {t("features.coaching")}
              </h3>
            </div>
            <div className="rounded-xl bg-gray-800 p-6 text-center">
              <div className="mb-4 text-4xl">⚙️</div>
              <h3 className="mb-2 text-xl font-semibold">
                {t("features.equipment")}
              </h3>
            </div>
            <div className="rounded-xl bg-gray-800 p-6 text-center">
              <div className="mb-4 text-4xl">🤝</div>
              <h3 className="mb-2 text-xl font-semibold">
                {t("features.community")}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────────────────── */}
      <section className="px-4 py-20 text-center">
        <h2 className="mb-4 text-3xl font-bold">{t("cta.title")}</h2>
        <p className="mb-8 text-lg text-gray-400">{t("cta.description")}</p>
        <Link
          href="/auth/register"
          className="rounded-full bg-red-600 px-8 py-3 text-lg font-semibold transition hover:bg-red-700"
        >
          {t("cta.button")}
        </Link>
      </section>
    </main>
  );
}