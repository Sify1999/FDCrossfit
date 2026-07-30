import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section className="relative flex min-h-[90vh] w-full items-center overflow-hidden">
        {/* Background image */}
        <Image
          src="/images/hero-bg.jpg"
          alt="FD Crossfit training"
          fill
          priority
          className="object-cover"
        />
        {/* Dark gradient overlay for readability, stronger toward the text side */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/50 to-black/20" />

        {/* Text content, aligned right */}
        <div className="relative z-10 flex w-full justify-end px-6 sm:px-12">
          <div className="max-w-xl text-right">
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mb-10 text-lg text-gray-300 sm:text-xl">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-wrap justify-end gap-4">
              <Link
                href="/auth/register"
                className="rounded-full bg-red-600 px-8 py-3 text-lg font-semibold transition hover:bg-red-700"
              >
                {t("hero.bookCta")}
              </Link>
              <Link
                href="/contact"
                className="rounded-full border-2 border-[#B4E3BD] px-8 py-3 text-lg font-semibold text-[#B4E3BD] transition hover:bg-[#B4E3BD] hover:text-black"
              >
                {t("hero.contactCta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── About Preview Section ───────────────────────────────── */}
      <section className="bg-white px-6 py-24 text-gray-900 sm:px-12">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          {/* Text content, left side */}
          <div>
            <span className="mb-3 block text-sm font-semibold uppercase tracking-widest text-red-600">
              {t("aboutPreview.eyebrow")}
            </span>
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("aboutPreview.title")}
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-gray-600">
              {t("aboutPreview.description")}
            </p>
            <Link
              href="/about"
              className="inline-block rounded-full bg-gray-900 px-8 py-3 text-lg font-semibold text-white transition hover:bg-black"
            >
              {t("aboutPreview.cta")}
            </Link>
          </div>

          {/* Image, right side */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
            <Image
              src="/images/about-preview.jpg"
              alt="Inside FD Crossfit gym"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </main>
  );
}