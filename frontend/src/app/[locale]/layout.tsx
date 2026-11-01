import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/lib/routing";
import "../globals.css";
import { archivoBlack, inter, vazirmatn } from "@/app/fonts";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

const SITE_URL = "https://fdcrossfit.ir";
// Preview image for Instagram / WhatsApp / Telegram links.
// Later, replace with a compressed 1200x630 JPG (under 300 KB) at
// /public/images/og.jpg and change this one constant to "/images/og.jpg".
const OG_IMAGE = "/images/hero-bg.png";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "site" });
  const title = t("title");
  const description = t("description");

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      type: "website",
      siteName: "FD Crossfit",
      title,
      description,
      locale: locale === "fa" ? "fa_IR" : "en_US",
      images: [{ url: OG_IMAGE, alt: "FD Crossfit" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();
  const isRTL = locale === "fa";

  return (
    <html
      lang={locale}
      dir={isRTL ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={`${archivoBlack.variable} ${inter.variable} ${vazirmatn.variable}`}
    >
      <body
        className={`bg-background text-white antialiased ${
          isRTL ? "font-body-fa" : "font-body"
        }`}
      >
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}