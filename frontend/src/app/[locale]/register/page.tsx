"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();

  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/register", {
        email: form.email,
        password: form.password,
        full_name: form.fullName || null,
        phone: form.phone || null,
      });
      router.push(`/${locale}/auth/login`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-white">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-bold">{t("registerTitle")}</h1>
        <p className="mb-8 text-gray-400">{t("registerSubtitle")}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">{t("fullName")}</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 outline-none focus:border-[#B4E3BD]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">{t("email")}</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 outline-none focus:border-[#B4E3BD]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">{t("phone")}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 outline-none focus:border-[#B4E3BD]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">{t("password")}</label>
            <input
              required
              minLength={8}
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 outline-none focus:border-[#B4E3BD]"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "..." : t("submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          {t("haveAccount")}{" "}
          <Link href={`/${locale}/auth/login`} className="text-[#B4E3BD] hover:underline">
            {t("signIn")}
          </Link>
        </p>
      </div>
    </main>
  );
}