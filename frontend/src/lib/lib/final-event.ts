/** The final event is secret for the public: E9 for advanced, E8 for the others. */
export function finalEventNumber(level: string): number {
  return level.trim().toLowerCase() === "advanced" ? 9 : 8;
}