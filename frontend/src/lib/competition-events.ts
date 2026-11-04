/**
 * Pre-built competition events.
 *
 * Events 1 & 2 run back-to-back as a single combined session, so they're
 * one entry labeled "Event 1&2"; event number 2 is intentionally skipped.
 * Events 5 & 6 run the same way and are one entry labeled "Event 5&6";
 * event number 6 is intentionally skipped.
 * The scheduled event groups are: 1 (="1&2"), 3, 4, 5 (="5&6"), 7, 8, 9.
 */
export const COMPETITION_EVENT_NUMBERS = [1, 3, 4, 5, 7, 8, 9] as const;

/**
 * Which event groups are held on each of the four competition days
 * (matching the seeded competition schedule).
 * Day 1 holds the combined "Event 1&2" session, Day 3 holds "Event 4" and
 * the combined "Event 5&6" session, and so on.
 */
export const COMPETITION_DAY_EVENT_GROUPS: Record<number, number[]> = {
  1: [1],
  2: [3],
  3: [4, 5],
  4: [7, 8, 9],
};

/**
 * Labels shown in SCHEDULING views (schedule manager card, rule-book day
 * chips, athlete heat/line pickers). Event 5 is the combined "Event 5&6"
 * session here — exactly like event 1 is "Event 1&2".
 */
export const COMPETITION_SCHEDULE_LABELS: Record<number, string> = {
  1: "Event 1&2",
  3: "Event 3",
  4: "Event 4",
  5: "Event 5&6",
  7: "Event 7",
  8: "Event 8",
  9: "Event 9",
};

/**
 * Labels used in SCORING views (score entry, athlete details). Events 5 and
 * 6 are still two separate ranked events there, so they keep separate labels —
 * only the schedule merges them into "Event 5&6".
 */
export const COMPETITION_EVENT_LABELS: Record<number, string> = {
  1: "Event 1&2",
  2: "Event 2",
  3: "Event 3",
  4: "Event 4",
  5: "Event 5",
  6: "Event 6",
  7: "Event 7",
  8: "Event 8",
  9: "Event 9",
};

/** Highest event number each level competes in. */
export const LEVEL_MAX_EVENT: Record<string, number> = {
  beginner: 8,
  intermediate: 8,
  advanced: 9,
};

/** True if the level has this event (beginner / intermediate stop at 8). */
export function levelHasEvent(level: string, event: number): boolean {
  const max = LEVEL_MAX_EVENT[level.trim().toLowerCase()] ?? 9;
  return event <= max;
}

/** Display label in SCHEDULING views (e.g. 1 → "Event 1&2", 5 → "Event 5&6"). */
export function scheduleEventLabel(event: number): string {
  return COMPETITION_SCHEDULE_LABELS[event] ?? eventLabel(event);
}

/** Short badge label in SCHEDULING views (e.g. 1 → "1&2", 5 → "5&6", 9 → "9"). */
export function scheduleEventBadge(event: number): string {
  return scheduleEventLabel(event).replace(/^Event\s*/, "");
}

/** Display label in SCORING views (e.g. 1 → "Event 1&2", 5 → "Event 5"). */
export function eventLabel(event: number): string {
  return COMPETITION_EVENT_LABELS[event] ?? `Event ${event}`;
}
