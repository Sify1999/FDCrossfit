import type {
  WorkoutSection,
  SingleMovementSection,
  ComplexSection,
  ConditioningSection,
  TextSection,
  MovementRowData,
} from "./types";

/**
 * Format a rest period in seconds to a human-readable string.
 * e.g. 120 → "2:00", 90 → "1:30", 60 → "1:00", 30 → "0:30"
 */
export function formatRest(seconds: number | null): string {
  if (!seconds && seconds !== 0) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Format weight as a human-readable string.
 * Accepts strings like "80kg", "80% 1RM", "BW", "BW+20kg", or numeric.
 */
export function formatWeight(weight: string | null): string {
  if (!weight) return "";
  return weight;
}

/**
 * Format a single movement row into display text.
 */
export function formatMovementRow(
  row: MovementRowData,
  includeWeight: boolean = true
): string {
  let text = "";
  if (row.reps && row.reps !== "1") {
    text += `${row.reps} `;
  }
  text += row.movement_name;
  if (includeWeight && row.weight) {
    text += ` @ ${row.weight}`;
  }
  return text.trim();
}

/**
 * Format a single movement section into display text.
 */
export function formatSingleMovementSection(
  section: SingleMovementSection
): string[] {
  const lines: string[] = [];
  lines.push(section.movement_name);

  // Build the main line: sets × reps @ weight
  const parts: string[] = [];
  if (section.sets) {
    parts.push(String(section.sets));
  }
  if (section.reps) {
    parts.push(`× ${section.reps}`);
  }
  if (section.weight) {
    parts.push(`@ ${section.weight}`);
  }
  if (parts.length > 0) {
    lines.push(parts.join(" "));
  }

  if (section.rest_seconds) {
    lines.push(`Rest: ${formatRest(section.rest_seconds)}`);
  }
  if (section.notes) {
    lines.push(section.notes);
  }
  return lines;
}

/**
 * Format a complex section into display text.
 */
export function formatComplexSection(section: ComplexSection): string[] {
  const lines: string[] = [];
  lines.push(section.complex_name);

  // List movements
  for (const mov of section.movements) {
    const reps = mov.reps && mov.reps !== "1" ? `${mov.reps} ` : "";
    lines.push(`  ${reps}${mov.movement_name}`);
  }

  // Sets/weight line
  const parts: string[] = [];
  if (section.sets) {
    parts.push(`${section.sets} sets`);
  }
  if (section.weight) {
    parts.push(`@ ${section.weight}`);
  }
  if (parts.length > 0) {
    lines.push(parts.join(" "));
  }

  if (section.rest_seconds) {
    lines.push(`Rest: ${formatRest(section.rest_seconds)}`);
  }
  if (section.notes) {
    lines.push(section.notes);
  }
  return lines;
}

/**
 * Format a conditioning section into display text.
 */
export function formatConditioningSection(
  section: ConditioningSection
): string[] {
  const lines: string[] = [];
  const fmt = section.format;

  if (fmt === "AMRAP") {
    lines.push(`AMRAP ${section.duration_minutes ?? ""}`.trim());
    for (const mov of section.movements) {
      lines.push(formatMovementRow(mov));
    }
  } else if (fmt === "EMOM") {
    lines.push(
      `EMOM ${section.duration_minutes ?? ""} min`.trim()
    );
    for (const mov of section.movements) {
      lines.push(`  :${formatMovementRow(mov)}`);
    }
  } else if (fmt === "FOR_TIME") {
    lines.push("FOR TIME");
    if (section.time_cap_minutes) {
      lines.push(`Time Cap: ${section.time_cap_minutes} min`);
    }
    for (const mov of section.movements) {
      lines.push(formatMovementRow(mov));
    }
  } else if (fmt === "RFT") {
    lines.push(
      `${section.rounds ?? "?"} ROUNDS FOR TIME`.trim()
    );
    for (const mov of section.movements) {
      lines.push(formatMovementRow(mov));
    }
  } else if (fmt === "TABATA") {
    lines.push("TABATA");
    lines.push(
      `${section.work_seconds ?? 20}s work / ${section.rest_seconds_interval ?? 10}s rest`
    );
    lines.push(`${section.rounds ?? 8} rounds`);
    for (const mov of section.movements) {
      lines.push(formatMovementRow(mov));
    }
  } else if (fmt === "CHIPPER") {
    lines.push("CHIPPER");
    for (let i = 0; i < section.movements.length; i++) {
      lines.push(`${i + 1}. ${formatMovementRow(section.movements[i])}`);
    }
  }

  if (section.notes) {
    lines.push(section.notes);
  }
  return lines;
}

/**
 * Format any workout section into human-readable lines.
 * Used for live preview and athlete rendering.
 */
export function formatSection(section: WorkoutSection): string[] {
  if (!section.type || section.type === "text") {
    const text = section as TextSection;
    return text.content ? text.content.split("\n") : [];
  }

  switch (section.type) {
    case "single":
      return formatSingleMovementSection(
        section as SingleMovementSection
      );
    case "complex":
      return formatComplexSection(section as ComplexSection);
    case "conditioning":
      return formatConditioningSection(
        section as ConditioningSection
      );
    default:
      return [];
  }
}

/**
 * Generate a short human-readable summary of a section.
 * Used as a label/header in the editor.
 */
export function sectionSummary(section: WorkoutSection): string {
  if (!section.type || section.type === "text") {
    const lines = (section as TextSection).content?.split("\n") || [];
    return lines[0] || "Free text";
  }

  switch (section.type) {
    case "single":
      return (section as SingleMovementSection).movement_name || "Movement";
    case "complex":
      return (section as ComplexSection).complex_name || "Complex";
    case "conditioning":
      return (section as ConditioningSection).format || "Conditioning";
    default:
      return "Section";
  }
}

/**
 * Generate a client-side section ID.
 */
export function newSectionId(): string {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * Generate a stable client-side row ID for MovementRowData.
 */
export function newRowId(): string {
  return "row_" + Math.random().toString(36).slice(2, 9);
}