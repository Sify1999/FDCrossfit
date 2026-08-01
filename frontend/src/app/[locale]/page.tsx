import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import CoachSpotlight from "./components/CoachSpotlight";
import Footer from "./components/Footer";
import GymGallery from "./components/GymGallery";


export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section className="relative flex min-h-[90vh] w-full items-center overflow-hidden">
        {/* Background image */}
        <Image
          src="/images/hero-bg.png"
          alt="FD Crossfit training"
          fill
          priority
          className="object-cover"
        />
        {/* Dark gradient overlay for readability, stronger toward the text side */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/50 to-black/20" />

        {/* Outer container: justify-start is a logical property, so it
            resolves to "left" in LTR (English) and "right" in RTL (Farsi)
            automatically, based on the <html dir="..."> from layout.tsx. */}
        <div className="relative z-10 flex w-full justify-start px-6 sm:px-12">
          {/* No text-align class here — text-align's initial value is
              "start", which already follows dir on its own. Adding
              text-right here is what was fighting the container above. */}
          <div className="max-w-lg">
            <h1 className="mb-6 whitespace-pre-line text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              {t("hero.title")}
            </h1>
            <h1 className="mb-6 whitespace-pre-line text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl text-[#B4E3BD]">
              {t("hero.name")}
            </h1>
            <h1 className="mb-6 whitespace-pre-line text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              {t("hero.welcome")}
            </h1>
            <p className="mb-10 text-lg text-gray-300 sm:text-xl">
              {t("hero.subtitle")}
            </p>
            {/* justify-start here too, not justify-end — buttons should
                start from the same edge as the text above them. */}
            <div className="flex flex-wrap justify-start gap-4">
              <Link
                href="/auth/register"
                className="text-black rounded-full bg-[#B4E3BD] px-8 py-3 text-lg font-semibold transition hover:bg-red-700"
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

      {/* ─── About Preview Section (unchanged) ───────────────────── */}
      <section className="bg-white px-6 py-40 text-gray-900 sm:px-12">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div>
            <span className="mb-3 block text-sm font-semibold uppercase tracking-widest text-[#91C78C]">
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
        <CoachSpotlight />
        <GymGallery />
        <Footer />
      



    </main>
  );
}