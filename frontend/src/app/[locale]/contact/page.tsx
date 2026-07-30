"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ContactPage() {
  const t = useTranslations("contactPage");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: wire this up to a backend /api/contact endpoint once it exists
    setSubmitted(true);
  }

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">{t("name")}</label>
            <input
              required
              type="text"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-[#B4E3BD]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">{t("email")}</label>
            <input
              required
              type="email"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-[#B4E3BD]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">{t("message")}</label>
            <textarea
              required
              rows={4}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-[#B4E3BD]"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-700"
          >
            {t("send")}
          </button>
          {submitted && (
            <p className="text-sm text-[#B4E3BD]">{t("successMessage")}</p>
          )}
        </form>
      </div>
    </main>
  );
}