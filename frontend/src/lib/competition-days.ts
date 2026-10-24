/**
 * Competition day labels — the four days run on 12–15 Aban (Jalali calendar).
 * en: "12 Aban" · fa: "۱۲ آبان" (Persian digits + Persian month, matching the fa UI).
 */

export const DAY_DATE_LABELS_EN: Record<number, string> = {
  1: "12 Aban",
  2: "13 Aban",
  3: "14 Aban",
  4: "15 Aban",
};

export const DAY_DATE_LABELS_FA: Record<number, string> = {
  1: "۱۲ آبان",
  2: "۱۳ آبان",
  3: "۱۴ آبان",
  4: "۱۵ آبان",
};

export function dayDateLabel(day: number, locale: "en" | "fa" = "en"): string {
  if (locale === "fa") return DAY_DATE_LABELS_FA[day] ?? `Day ${day}`;
  return DAY_DATE_LABELS_EN[day] ?? `Day ${day}`;
}