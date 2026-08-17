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

const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Mirrors the backend's Pydantic validators so the common cases never
   * even reach the API — the person sees the exact rule they broke
   * immediately, in their own language. */
  function validate(): string | null {
    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      return t("usernameLength");
    }
    if (!USERNAME_PATTERN.test(trimmedUsername)) {
      return t("usernameInvalidChars");
    }
    if (password.length < 8) {
      return t("passwordTooShort");
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return t("passwordRequirements");
    }
    if (password !== confirmPassword) {
      return t("passwordMismatch");
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        email,
        username: username.trim(),
        password,
        phone: phone || undefined,
      });

      const tokens = await api.post<{ access_token: string; refresh_token: string }>(
        "/auth/login",
        { identifier: email, password },
      );
      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
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
          <h1 className="mb-2 text-3xl font-bold tracking-tight">{t("registerTitle")}</h1>
          <p className="text-gray-400">{t("registerSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">{t("username")}</label>
            <input
              required
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className={inputClasses}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">{t("phone")}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className={inputClasses}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">{t("email")}</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={inputClasses}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">{t("password")}</label>
            <PasswordInput
              required
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              className={inputClasses}
              showLabel={t("showPassword")}
              hideLabel={t("hidePassword")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">{t("confirmPassword")}</label>
            <PasswordInput
              required
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
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
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-medium text-[#B4E3BD] hover:text-white hover:underline">
            {t("signIn")}
          </Link>
        </p>
      </div>
    </main>
  );
}
