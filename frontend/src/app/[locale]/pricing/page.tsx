import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";

const PLANS = [
  { key: "basic", name: "Basic", price: "990,000", features: ["8 sessions / month", "Access to open gym", "Community events"] },
  { key: "standard", name: "Standard", price: "1,590,000", features: ["Unlimited sessions", "Nutrition guidance", "Community events"], popular: true },
  { key: "premium", name: "Premium", price: "2,290,000", features: ["Unlimited sessions", "1-on-1 coaching", "Nutrition guidance", "Priority booking"] },
];

export default function PricingPage() {
  const t = useTranslations("pricingPage");

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-20 text-white">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mb-16 text-lg text-gray-400">{t("subtitle")}</p>

        <div className="grid gap-8 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl p-8 transition hover:-translate-y-1 ${
                plan.popular
                  ? "border-2 border-[#B4E3BD] bg-gray-800"
                  : "border border-gray-800 bg-gray-900"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#B4E3BD] px-3 py-1 text-xs font-semibold text-black">
                  {t("popular")}
                </span>
              )}
              <h3 className="mb-2 text-xl font-semibold">{plan.name}</h3>
              <div className="mb-6 flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-sm text-gray-400">{t("perMonth")}</span>
              </div>
              <ul className="mb-8 space-y-2 text-sm text-gray-400">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center justify-center gap-2">
                    <span className="text-[#B4E3BD]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="register"
                className={`block rounded-full px-6 py-3 text-sm font-semibold transition ${
                  plan.popular
                    ? "bg-[#B4E3BD] text-black hover:bg-white"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
              >
                {t("cta")}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}