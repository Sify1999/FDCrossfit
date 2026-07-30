"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ access_token: string; refresh_token: string }>(
        "/auth/login",
        { email, password },
      );
      // TODO: move token storage into a proper auth context / secure cookie
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-white">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-bold">{t("loginTitle")}</h1>
        <p className="mb-8 text-gray-400">{t("loginSubtitle")}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">{t("email")}</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 outline-none focus:border-[#B4E3BD]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">{t("password")}</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 outline-none focus:border-[#B4E3BD]"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#B4E3BD] px-6 py-3 font-semibold text-black transition hover:bg-white disabled:opacity-50"
          >
            {loading ? "..." : t("submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          {t("noAccount")}{" "}
          <Link href={`/${locale}/auth/register`} className="text-[#B4E3BD] hover:underline">
            {t("signUp")}
          </Link>
        </p>
      </div>
    </main>
  );
}