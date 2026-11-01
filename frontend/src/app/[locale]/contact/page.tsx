"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

const WHATSAPP_HREF = "https://chat.whatsapp.com/ITsBuTpbiIAEILOjaMgyQC";
const PHONE_HREF = "tel:+989102901448";
const EMAIL = "alirezagh1245@gmail.com";
const INSTAGRAM_HREF = "https://www.instagram.com/crossfit.fd/";

function IconWhatsApp() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function ContactCard({
  icon,
  title,
  value,
  href,
  external = false,
  highlight = false,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  href: string;
  external?: boolean;
  highlight?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`group flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 ${
        highlight
          ? "border-transparent bg-[#B4E3BD] text-black shadow-lg shadow-[#B4E3BD]/20 hover:bg-[#a3dcae]"
          : "border-gray-800 bg-gray-900/60 text-white hover:border-[#B4E3BD]/60 hover:bg-gray-900"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          highlight ? "bg-black/10 text-black" : "bg-[#B4E3BD]/10 text-[#B4E3BD]"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-start">
        <span className="block text-sm font-semibold">{title}</span>
        <span
          dir="ltr"
          className={`block truncate text-xs ${highlight ? "text-black/60" : "text-gray-400"} ${
            // keep Latin values left-aligned even inside RTL layouts
            "text-left"
          }`}
        >
          {value}
        </span>
      </span>
    </a>
  );
}

export default function ContactPage() {
  const t = useTranslations("contactPage");
  const locale = useLocale();
  const isRTL = locale === "fa";

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-20 text-white">
      <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-2">
        <div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mb-10 text-gray-400">{t("subtitle")}</p>

          <div className="mb-6">
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[#B4E3BD]">
              {t("infoTitle")}
            </h3>
            <p className="text-gray-400">{t("address")}</p>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[#B4E3BD]">
              {t("hoursTitle")}
            </h3>
            <p className="text-gray-400">{t("hours")}</p>
          </div>
        </div>

        <div className="space-y-3">
          <ContactCard
            highlight
            external
            href={WHATSAPP_HREF}
            icon={<IconWhatsApp />}
            title={isRTL ? "واتساپ" : "WhatsApp"}
            value={isRTL ? "پیام بدید" : "Message us "}
          />
          <ContactCard
            href={PHONE_HREF}
            icon={<Image src="/icons/phone.svg" alt="" width={22} height={22} />}
            title={isRTL ? "تماس تلفنی" : "Call us"}
            value="+98 910 290 1448"
          />
          <ContactCard
            external
            href={INSTAGRAM_HREF}
            icon={<Image src="/icons/instagram.svg" alt="" width={22} height={22} />}
            title={isRTL ? "اینستاگرام" : "Instagram"}
            value="@crossfit.fd"
          />
          <ContactCard
            href={`mailto:${EMAIL}`}
            icon={<Image src="/icons/mail.svg" alt="" width={22} height={22} />}
            title={isRTL ? "ایمیل" : "Email"}
            value={EMAIL}
          />
        </div>
      </div>
    </main>
  );
}