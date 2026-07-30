"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

// Fixed display order for the toggle — independent of routing.ts's locale order,
// this is purely a UI decision (English shown first, Farsi second).
const LOCALES = ["en", "fa"] as const;

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const activeIndex = LOCALES.indexOf(locale as (typeof LOCALES)[number]);

  function switchTo(target: string) {
    if (target === locale) return; // already on this locale, do nothing
    // pathname always starts with "/<locale>/..." because routing.ts sets
    // localePrefix: "always" — so segment[1] is always the current locale.
    const segments = pathname.split("/");
    segments[1] = target;
    router.push(segments.join("/") || "/");
  }

  return (
    <div className="relative flex rounded-full border border-white/20 p-0.5 text-sm font-medium">
      {/* Sliding highlight — width is 50% of the container (2 options),
          and it moves via translateX based on which option is active.
          `transition-transform` is what makes it glide instead of jump. */}
      <span
        className="absolute inset-y-0.5 w-1/2 rounded-full bg-[#B4E3BD] transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />

      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          className={`relative z-10 w-10 rounded-full px-3 py-1.5 uppercase transition-colors duration-300 ${
            l === locale ? "text-black" : "text-white hover:text-[#B4E3BD]"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}