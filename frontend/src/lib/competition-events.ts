/**
 * Pre-built competition events.
 *
 * Events 1 & 2 run back-to-back as a single combined session, so they're
 * one entry labeled "Event 1&2"; event number 2 is intentionally skipped.
 * The scheduled event groups are: 1 (="1&2"), 3, 4, 5, 6, 7, 8, 9.
 */
export const COMPETITION_EVENT_NUMBERS = [1, 3, 4, 5, 6, 7, 8, 9] as const;

export const COMPETITION_EVENT_LABELS: Record<number, string> = {
  1: "Event 1&2",
  3: "Event 3",
  4: "Event 4",
  5: "Event 5",
  6: "Event 6",
  7: "Event 7",
  8: "Event 8",
  9: "Event 9",
};

/** Display label for an event number (e.g. 1 → "Event 1&2", 4 → "Event 4"). */
export function eventLabel(event: number): string {
  return COMPETITION_EVENT_LABELS[event] ?? `Event ${event}`;
}