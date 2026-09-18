// ─── Movement ────────────────────────────────────────────────────────
export type Movement = {
  id: number;
  name: string;
  default_unit: string;
};

// ─── Cardio movements that support expanded unit options ─────────────
export const CARDIO_MOVEMENT_NAMES = new Set([
  "Assault Bike",
  "Bike",
  "Row",
  "Ski Erg",
]);

export const CARDIO_UNIT_OPTIONS = [
  { value: "m", label: "meters (m)" },
  { value: "cal", label: "calories" },
  { value: "sec", label: "time (sec)" },
  { value: "watts", label: "watts" },
  { value: "pace", label: "pace" },
  { value: "rpm", label: "rpm" },
  { value: "distance/time", label: "distance / time" },
  { value: "calories/time", label: "calories / time" },
] as const;

export const DEFAULT_UNIT_OPTIONS = [
  { value: "reps", label: "reps" },
  { value: "cal", label: "cal" },
  { value: "m", label: "m" },
  { value: "sec", label: "sec" },
] as const;

// ─── Complex ─────────────────────────────────────────────────────────
export type ComplexMovementItem = {
  movement_id: number;
  movement_name: string;
  reps: string;
};

export type Complex = {
  id: number;
  name: string;
  movements: ComplexMovementItem[];
};

// ─── Workout Section types (discriminated union) ─────────────────────

export type MovementRowData = {
  movement_id: number | null;
  movement_name: string;
  reps: string;
  /** For CHIPPER: multiple sets of reps (e.g. ["21", "15", "9"]) */
  repsSets: string[];
  unit: string;
  weight: string | null;
  /** Rest seconds after each set/movement (empty string = no rest) */
  restSeconds?: string;
  /** Stable client-side identifier. Required for React keys, reorder, and exclude-ids filtering. */
  rowId: string;
};

/** Single strength/accessory movement */
export type SingleMovementSection = {
  id: string;
  label: string;
  type: "single";
  movement_id: number;
  movement_name: string;
  sets: number | null;
  reps: string | null;
  weight: string | null;
  rest_seconds: number | null;
  tempo: string | null;
  notes: string | null;
  content: string;
  /** Multi-set rows — each set has its own reps & weight */
  movement_sets?: { reps: string; weight: string }[];
  /** Coach-prescribed intensity/effort fields */
  rpe: string | null;
  effort: string | null;
  zone: string | null;
};

/** Complex — multiple movements performed as a sequence */
export type ComplexSection = {
  id: string;
  label: string;
  type: "complex";
  complex_id: number | null;
  complex_name: string;
  movements: MovementRowData[];
  sets: number | null;
  weight: string | null;
  rest_seconds: number | null;
  notes: string | null;
  content: string;
  /** Coach-prescribed intensity/effort fields */
  rpe: string | null;
  effort: string | null;
  zone: string | null;
};

/** Conditioning — AMRAP, EMOM, For Time, RFT, Tabata, Chipper */
export type ConditioningSection = {
  id: string;
  label: string;
  type: "conditioning";
  format: ConditioningFormat;
  duration_minutes: number | null;
  interval_minutes: number | null;
  time_cap_minutes: number | null;
  rounds: number | null;
  work_seconds: number | null;
  rest_seconds_interval: number | null;
  score_type: string | null;
  movements: MovementRowData[];
  notes: string | null;
  content: string;
  /** EMOM interval groups — each covers a range of minutes with its own movements */
  interval_groups?: { label: string; movements: MovementRowData[] }[];
  /** Coach-prescribed intensity/effort fields */
  rpe: string | null;
  effort: string | null;
  zone: string | null;
  /** Ranking direction: "higher" or "lower" for leaderboard scoring */
  ranking_direction: string | null;
};

export type ConditioningFormat =
  | "AMRAP"
  | "EMOM"
  | "FOR_TIME"
  | "RFT"
  | "TABATA"
  | "CHIPPER";

/** Free-text section (legacy + new) */
export type TextSection = {
  id: string;
  label: string;
  type: "text";
  content: string;
  /** Coach-prescribed intensity/effort fields */
  rpe: string | null;
  effort: string | null;
  zone: string | null;
};

export type WorkoutSection =
  | SingleMovementSection
  | ComplexSection
  | ConditioningSection
  | TextSection;

// ─── Builder state machine ──────────────────────────────────────────

export type SectionType = "single" | "complex" | "conditioning" | "text";

export type BuilderStep =
  | "select-type"
  | "configure-single"
  | "configure-complex"
  | "configure-conditioning"
  | "configure-text";

// ─── API Workout types (mirrors backend) ─────────────────────────────

export type ApiWorkout = {
  id: number;
  date: string;
  title: string;
  coach_name: string | null;
  sections: WorkoutSection[];
};

export type UiWorkout = {
  title: string;
  coachName?: string;
  sections: WorkoutSection[];
};