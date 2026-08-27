// ─── Movement ────────────────────────────────────────────────────────
export type Movement = {
  id: number;
  name: string;
  default_unit: string;
};

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
  unit: string;
  weight: string | null;
  id?: string; // client-side identifier
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
  movements: MovementRowData[];
  notes: string | null;
  content: string;
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