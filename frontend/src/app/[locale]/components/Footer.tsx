"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

const PHONE_HREF = "tel:+989102901448";
const EMAIL_HREF = "mailto:alirezagh1245@gmail.com";
const INSTAGRAM_HREF = "https://www.instagram.com/crossfit.fd/";

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations("footer");

  const links = [
    { href: `/${locale}`, label: t("links.home") },
    { href: `/${locale}/about`, label: t("links.about") },
    { href: `/${locale}/coaches`, label: t("links.coaches") },
    { href: `/${locale}/pricing`, label: t("links.pricing") },
    { href: `/${locale}/contact`, label: t("links.contact") },
    { href: `/${locale}/competition`, label: t("links.competition") },
  ];

  return (
    <footer className="justify-center bg-black px-6 pt-20 text-center text-white sm:px-12">
      <div className="mx-auto grid max-w-6xl gap-12 border-b border-white/10 pb-16 md:grid-cols-3">
        {/* Brand */}
        <div className="flex flex-col items-center">
          <Link href={`/${locale}`} className="flex items-center">
            <Image
              src="/images/fdLogo.png"
              alt="FD Crossfit Logo"
              width={100}
              height={100}
            />
            <span className="-ml-3 text-2xl font-bold text-[#B4E3BD]">
              FDCrossfit
            </span>
          </Link>

          <p className="mt-5 max-w-xs leading-relaxed text-gray-400">
            {t("description")}
          </p>

          {/* Registration page lives at /register (not /auth/register) */}
          <Link
            href={`/${locale}/register`}
            className="mt-8 inline-block rounded-full bg-[#B4E3BD] px-7 py-3 font-semibold text-black transition hover:bg-white"
          >
            {t("join")}
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex flex-col items-center md:items-start md:text-start">
          <h3 className="mb-5 text-lg font-bold uppercase tracking-wide text-[#B4E3BD]">
            {t("navigation")}
          </h3>

          <ul className="space-y-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-gray-400 transition hover:text-[#B4E3BD]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="mb-5 text-lg font-bold uppercase tracking-wide text-[#B4E3BD]">
            {t("contact")}
          </h3>

          <div className="flex flex-col space-y-5 text-gray-400">
            <ContactItem icon="/icons/map.svg" text={t("address")} />
            <ContactItem icon="/icons/phone.svg" text={t("phone")} href={PHONE_HREF} />
            <ContactItem icon="/icons/mail.svg" text={t("email")} href={EMAIL_HREF} />
            <ContactItem
              icon="/icons/instagram.svg"
              text={t("instagram")}
              href={INSTAGRAM_HREF}
              external
            />
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} FDCrossfit.
        {t("rights")}
      </div>
    </footer>
  );
}

function ContactItem({
  icon,
  text,
  href,
  external = false,
}: {
  icon: string;
  text: string;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <>
      <Image
        src={icon}
        alt=""
        width={22}
        height={22}
        className="shrink-0"
      />
      <span>{text}</span>
    </>
  );

  if (!href) {
    return <div className="flex items-center gap-3">{content}</div>;
  }

  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex items-center gap-3 transition hover:text-[#B4E3BD]"
    >
      {content}
    </a>
  );
}