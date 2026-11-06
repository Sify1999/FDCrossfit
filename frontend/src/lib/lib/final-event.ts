/** The final event is secret for the public: E9 for advanced, E8 for the others. */
/** Set to false once the event is over: everyone sees the final event (E8 / E9). */
export const HIDE_FINAL_EVENT = false;

export function finalEventNumber(level: string): number {
  return level.trim().toLowerCase() === "advanced" ? 9 : 8;
}