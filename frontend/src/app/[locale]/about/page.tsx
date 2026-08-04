"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import ContactMapSection from "../components/ContactMapSection";

export default function AboutPage() {
  const t = useTranslations("aboutPage");
  const locale = useLocale();

  // Same gradient-flip logic as the homepage hero, for RTL/LTR.
  const gradientDirection = locale === "fa" ? "bg-gradient-to-l" : "bg-gradient-to-r";

  const values = [
    { title: t("value1Title"), text: t("value1"), icon: "🤝" },
    { title: t("value2Title"), text: t("value2"), icon: "🎯" },
    { title: t("value3Title"), text: t("value3"), icon: "📈" },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section className="relative flex min-h-[60vh] w-full items-center overflow-hidden">
        <Image
          src="/images/gym/gym3.png"
          alt="Inside FD Crossfit"
          fill
          priority
          className="object-cover"
        />
        <div className={`absolute inset-0 ${gradientDirection} from-black/90 via-black/60 to-black/30`} />

        <div className="relative z-10 flex w-full justify-start px-6 sm:px-12">
          <div className="max-w-xl">
            <span className="mb-3 block text-sm font-semibold uppercase tracking-widest text-[#B4E3BD]">
              {t("storyEyebrow")}
            </span>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="max-w-md text-lg text-gray-300 sm:text-xl">
              {t("heroSubtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Founding Story ───────────────────────────────────────── */}
      <section className="px-6 py-24 sm:px-12">
        <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2">
          {/* Founder photo, ring-style matching CoachSpotlight's PeekCircle */}
          <div className="flex justify-center">
            <div className="relative h-64 w-64 shrink-0 sm:h-80 sm:w-80">
              <div className="h-full w-full overflow-hidden rounded-full ring-4 ring-[#B4E3BD] ring-offset-4 ring-offset-black shadow-[0_0_60px_-15px_#B4E3BD]">
                <Image
                  src="/images/coaches/ali.jpg"
                  alt={t("founderName")}
                  width={320}
                  height={320}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div>
            <span className="mb-3 block text-sm font-semibold uppercase tracking-widest text-[#B4E3BD]">
              {t("storyEyebrow")}
            </span>
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("storyTitle")}
            </h2>
            <p className="mb-4 leading-relaxed text-gray-400">{t("storyText1")}</p>
            <p className="mb-8 leading-relaxed text-gray-400">{t("storyText2")}</p>

            <div>
              <p className="font-semibold text-white">{t("founderName")}</p>
              <p className="text-sm text-[#B4E3BD]">{t("founderRole")}</p>
            </div>
          </div>
        </div>
      </section>
{/* ─── Workflow / Process ──────────────────────────────────────── */}
      <section className="bg-[#111111] px-6 py-24 sm:px-12" dir="ltr">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <span className="mb-3 block text-sm font-semibold uppercase tracking-widest text-[#B4E3BD]">
              {t("workflowEyebrow")}
            </span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("workflowTitle")}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "/icons/salad.svg", title: t("step1Title"), text: t("step1Text") },
              { icon: "/icons/dumbbell.svg", title: t("step2Title"), text: t("step2Text") },
              { icon: "/icons/repeat.svg", title: t("step3Title"), text: t("step3Text") },
              { icon: "/icons/trophy.svg", title: t("step4Title"), text: t("step4Text") },
            ].map((step, i) => (
              <div
                key={step.title}
                className="
                group relative flex flex-col items-center rounded-2xl
                border border-white/10 bg-[#181818] p-8 text-center
                shadow-lg shadow-black/40
                transition-all duration-300
                hover:-translate-y-2 hover:border-[#B4E3BD]
                hover:shadow-2xl hover:shadow-[#B4E3BD]/20
                "
              >
                {/* Step number badge */}
                <span className="absolute -top-3 rounded-full border border-white/10 bg-black px-3 py-1 text-xs font-semibold text-gray-500 transition group-hover:border-[#B4E3BD]/50 group-hover:text-[#B4E3BD]">
                  {i + 1}
                </span>

                {/* Icon circle */}
                <div
                  className="
                  mb-5 mt-2 flex h-16 w-16 items-center justify-center
                  rounded-full border-2 border-[#B4E3BD]/30 bg-[#1c1c1c]
                  transition-all duration-300
                  group-hover:border-[#B4E3BD] group-hover:bg-black
                  "
                >
                  <Image
                    src={step.icon}
                    alt=""
                    width={28}
                    height={28}
                  />
                </div>

                <h3 className="mb-2 text-lg font-semibold text-[#B4E3BD] transition group-hover:text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
        {/* ─── Contact + Map ─────────────────────────────────────────── */}
        <ContactMapSection />

      {/* ─── Closing CTA ──────────────────────────────────────────── */}
      <section className="px-6 py-24 text-center sm:px-12">
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{t("ctaTitle")}</h2>
        <p className="mb-8 text-gray-400">{t("ctaSubtitle")}</p>
        <Link
          href="/register"
          className="inline-block rounded-full bg-[#B4E3BD] px-8 py-3 text-lg font-semibold text-black transition hover:bg-white"
        >
          {t("ctaButton")}
        </Link>
      </section>
    </main>
  );
}