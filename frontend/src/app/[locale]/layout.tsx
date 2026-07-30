import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/lib/routing";
import "../globals.css";
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
  const t = await getTranslations();
  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"}>
      <body>
        <NextIntlClientProvider messages={messages}>

          <Navbar />

          {children}



        </NextIntlClientProvider>
      </body>
    </html>
  );
}