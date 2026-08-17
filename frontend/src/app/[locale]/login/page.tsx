"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/lib/navigation";
import { api, getErrorMessage } from "@/lib/api-client";
import PasswordInput from "../components/PasswordInput";

const inputClasses =
  "w-full rounded-lg border border-gray-800 bg-gray-950/60 px-4 py-3 text-white outline-none " +
  "placeholder:text-gray-600 transition-all duration-200 " +
  "focus:border-[#B4E3BD]/60 focus:bg-gray-950 focus:ring-2 focus:ring-[#B4E3BD]/20 " +
  "[color-scheme:dark] autofill:shadow-[inset_0_0_0_1000px_theme(colors.gray.950)]";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
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
        { identifier, password },
      );
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      router.push("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, t("genericError")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gray-950 px-4 py-16 text-white">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900/60 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <div className="mb-8">
          <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.2em] text-[#B4E3BD]">
            FD CrossFit
          </span>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">{t("loginTitle")}</h1>
          <p className="text-gray-400">{t("loginSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">{t("identifier")}</label>
            <input
              required
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              className={inputClasses}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">{t("password")}</label>
            <PasswordInput
              required
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              className={inputClasses}
              showLabel={t("showPassword")}
              hideLabel={t("hidePassword")}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#B4E3BD] px-6 py-3 font-semibold text-black shadow-[0_8px_24px_rgba(180,227,189,0.15)] transition-all duration-200 hover:bg-white hover:shadow-[0_8px_24px_rgba(255,255,255,0.1)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "..." : t("submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          {t("noAccount")}{" "}
          <Link href="/register" className="font-medium text-[#B4E3BD] hover:text-white hover:underline">
            {t("signUp")}
          </Link>
        </p>
      </div>
    </main>
  );
}
