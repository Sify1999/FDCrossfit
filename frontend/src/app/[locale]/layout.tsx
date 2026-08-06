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

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: "FD Crossfit",
  description: "FD Crossfit Gym - Best Crossfit Training",
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const t = await getTranslations();
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