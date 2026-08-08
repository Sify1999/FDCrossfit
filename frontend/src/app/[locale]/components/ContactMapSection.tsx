"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";

const MAP_EMBED_SRC =
  "https://www.google.com/maps?q=35.83099962173378,51.00531177488845&z=16&output=embed";

export default function ContactMapSection() {
  const t = useTranslations("aboutPage");
  const tFooter = useTranslations("footer");
  const locale = useLocale();

  const isRTL = locale === "fa";

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapSlow, setMapSlow] = useState(false);

  useEffect(() => {
    setMapLoaded(false);
    setMapSlow(false);

    // Google Maps can sometimes take a while to fire iframe onLoad.
    // Never let the loading overlay stay forever.
    const timer = setTimeout(() => {
      setMapSlow(true);
      setMapLoaded(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [locale]);

  return (
    <section className="bg-[#0f0f0f] px-6 py-32 text-white sm:px-12">
      {/* Top divider */}

      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <span className="mb-4 block text-sm font-bold uppercase tracking-wide text-[#B4E3BD]">
            {t("contactEyebrow")}
          </span>

          <h2 className="text-4xl font-black uppercase tracking-tight sm:text-5xl">
            {t("contactTitle")}
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-gray-400">
            {t("contactSubtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
          {/* Contact details */}
          <div
            className={`
              hidden flex-col justify-center gap-6 rounded-3xl
              border border-white/10 bg-[#181818] p-10
              shadow-2xl shadow-black/40 lg:flex
              ${isRTL ? "lg:order-2" : "lg:order-1"}
            `}
          >
            <ContactRow
              icon="/icons/map.svg"
              label={tFooter("address")}
            />

            <a href="tel:+989102901448" className="block">
              <ContactRow
                icon="/icons/phone.svg"
                label={tFooter("phone")}
              />
            </a>

            <a href="mailto:info@gym.com" className="block">
              <ContactRow
                icon="/icons/mail.svg"
                label={tFooter("email")}
              />
            </a>

            <a
              href="https://www.instagram.com/crossfit.fd/"
              className="block"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ContactRow
                icon="/icons/instagram.svg"
                label={tFooter("instagram")}
              />
            </a>
          </div>

          {/* Map */}
          <div
            className={`
              relative aspect-square overflow-hidden rounded-3xl
              border border-[#B4E3BD]/10 shadow-2xl
              lg:aspect-auto
              ${isRTL ? "lg:order-1" : "lg:order-2"}
            `}
          >
            {/* Loading overlay */}
            {!mapLoaded && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#181818]">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-[#B4E3BD]" />

                  <span className="text-sm text-gray-400">
                    {isRTL
                      ? "در حال بارگذاری نقشه..."
                      : "Loading map..."}
                  </span>
                </div>
              </div>
            )}

            <iframe
              src={MAP_EMBED_SRC}
              onLoad={() => {
                setMapLoaded(true);
                setMapSlow(false);
              }}
              className="h-full min-h-[320px] w-full border-0 grayscale invert-[0.92] contrast-[0.9]"
              referrerPolicy="strict-origin-when-cross-origin"
              title="FD Crossfit location"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactRow({
  icon,
  label,
}: {
  icon: string | ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4">
      {typeof icon === "string" ? (
        <Image
          src={icon}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6"
        />
      ) : (
        icon
      )}

      <span className="text-gray-300">{label}</span>
    </div>
  );
}