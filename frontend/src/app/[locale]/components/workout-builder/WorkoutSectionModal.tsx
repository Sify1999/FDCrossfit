"use client";
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { api, getErrorMessage } from "@/lib/api-client";
import { TypeCard } from "./UiHelpers";
import SingleMovementForm from "./SingleMovementForm";
import ComplexForm from "./ComplexForm";
import ConditioningForm from "./ConditioningForm";
import TextForm from "./TextForm";
import type {
  Movement,
  WorkoutSection,
  SingleMovementSection,
  ComplexSection,
  ConditioningSection,
  TextSection,
} from "./types";
import type { SingleFormState } from "./SingleMovementForm";
import type { ComplexFormState } from "./ComplexForm";
import type { ConditioningFormState } from "./ConditioningForm";
import type { TextFormState } from "./TextForm";
import { formatSection, newSectionId } from "./section-formatter";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (sections: WorkoutSection[]) => void;
  editSection?: WorkoutSection | null;
  onEdit?: (section: WorkoutSection) => void;
};

type SectionType = "single" | "complex" | "conditioning" | "text";
type Step = "select-type" | "configure-single" | "configure-complex" | "configure-conditioning" | "configure-text";

function defaultSingleState(): SingleFormState {
  return { movement: null, sets: "", reps: "", weight: "", restSeconds: "", tempo: "", notes: "", label: "" };
}
function defaultComplexState(): ComplexFormState {
  return { selectedComplexId: null, complexName: "", movements: [], sets: "", weight: "", restSeconds: "", notes: "", label: "" };
}
function defaultCondState(): ConditioningFormState {
  return { format: null, durationMinutes: "", intervalMinutes: "", timeCapMinutes: "", rounds: "", workSeconds: "", restSecondsInterval: "", movements: [], notes: "", label: "" };
}
function defaultTextState(): TextFormState {
  return { label: "", content: "" };
}

export default function WorkoutSectionModal({ open, onClose, onAdd, editSection, onEdit }: Props) {
  const t = useTranslations("workoutBuilder");

  const [step, setStep] = useState<Step>("select-type");
  const [selectedType, setSelectedType] = useState<SectionType | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [singleState, setSingleState] = useState<SingleFormState>(defaultSingleState());
  const [complexState, setComplexState] = useState<ComplexFormState>(defaultComplexState());
  const [condState, setCondState] = useState<ConditioningFormState>(defaultCondState());
  const [textState, setTextState] = useState<TextFormState>(defaultTextState());

  const resetAll = useCallback(() => {
    setStep("select-type");
    setSelectedType(null);
    setErr(null);
    setBusy(false);
    setSingleState(defaultSingleState());
    setComplexState(defaultComplexState());
    setCondState(defaultCondState());
    setTextState(defaultTextState());
  }, []);

  // ── Reset or pre-fill on open ──────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (editSection) {
      setSelectedType(editSection.type as SectionType);
      switch (editSection.type) {
        case "single": {
          const s = editSection as SingleMovementSection;
          setSingleState({
            movement: s.movement_id ? { id: s.movement_id, name: s.movement_name, default_unit: "reps" } : null,
            sets: s.sets?.toString() ?? "", reps: s.reps ?? "",
            weight: s.weight ?? "", restSeconds: s.rest_seconds?.toString() ?? "",
            tempo: s.tempo ?? "", notes: s.notes ?? "", label: s.label ?? "",
          });
          setStep("configure-single"); break;
        }
        case "complex": {
          const c = editSection as ComplexSection;
          setComplexState({
            selectedComplexId: c.complex_id, complexName: c.complex_name,
            movements: c.movements || [], sets: c.sets?.toString() ?? "",
            weight: c.weight ?? "", restSeconds: c.rest_seconds?.toString() ?? "",
            notes: c.notes ?? "", label: c.label ?? "",
          });
          setStep("configure-complex"); break;
        }
        case "conditioning": {
          const cd = editSection as ConditioningSection;
          setCondState({
            format: cd.format, durationMinutes: cd.duration_minutes?.toString() ?? "",
            intervalMinutes: cd.interval_minutes?.toString() ?? "",
            timeCapMinutes: cd.time_cap_minutes?.toString() ?? "",
            rounds: cd.rounds?.toString() ?? "",
            workSeconds: cd.work_seconds?.toString() ?? "",
            restSecondsInterval: cd.rest_seconds_interval?.toString() ?? "",
            movements: cd.movements || [], notes: cd.notes ?? "", label: cd.label ?? "",
          });
          setStep("configure-conditioning"); break;
        }
        case "text": {
          const tx = editSection as TextSection;
          setTextState({ label: tx.label, content: tx.content });
          setStep("configure-text"); break;
        }
      }
    } else {
      resetAll();
    }
  }, [open, editSection, resetAll]);

  // ── Choose type ────────────────────────────────────────────────────
  function chooseType(type: SectionType) {
    setSelectedType(type);
    setErr(null);
    if (type === "single") setStep("configure-single");
    else if (type === "complex") setStep("configure-complex");
    else if (type === "conditioning") setStep("configure-conditioning");
    else if (type === "text") setStep("configure-text");
  }

  // ── Build section from current state (pure, no side effects) ────────
  function buildSection(): WorkoutSection | null {
    const id = editSection ? editSection.id : newSectionId();

    if (selectedType === "single") {
      if (!singleState.movement?.id) return null;
      return {
        id, type: "single", label: singleState.label || singleState.movement.name,
        movement_id: singleState.movement.id, movement_name: singleState.movement.name,
        sets: singleState.sets ? Number(singleState.sets) : null,
        reps: singleState.reps || null, weight: singleState.weight || null,
        rest_seconds: singleState.restSeconds ? Number(singleState.restSeconds) : null,
        tempo: singleState.tempo || null, notes: singleState.notes || null,
        content: "",
      } as SingleMovementSection;
    }

    if (selectedType === "complex") {
      if (complexState.movements.length === 0) return null;
      return {
        id, type: "complex", label: complexState.label || complexState.complexName || "Complex",
        complex_id: complexState.selectedComplexId, complex_name: complexState.complexName,
        movements: complexState.movements,
        sets: complexState.sets ? Number(complexState.sets) : null,
        weight: complexState.weight || null,
        rest_seconds: complexState.restSeconds ? Number(complexState.restSeconds) : null,
        notes: complexState.notes || null, content: "",
      } as ComplexSection;
    }

    if (selectedType === "conditioning") {
      if (!condState.format || condState.movements.length === 0) return null;
      return {
        id, type: "conditioning", label: condState.label || condState.format,
        format: condState.format,
        duration_minutes: condState.durationMinutes ? Number(condState.durationMinutes) : null,
        interval_minutes: condState.intervalMinutes ? Number(condState.intervalMinutes) : null,
        time_cap_minutes: condState.timeCapMinutes ? Number(condState.timeCapMinutes) : null,
        rounds: condState.rounds ? Number(condState.rounds) : null,
        work_seconds: condState.workSeconds ? Number(condState.workSeconds) : null,
        rest_seconds_interval: condState.restSecondsInterval ? Number(condState.restSecondsInterval) : null,
        movements: condState.movements, notes: condState.notes || null, content: "",
      } as ConditioningSection;
    }

    if (selectedType === "text") {
      return { id, type: "text", label: textState.label || "Free text", content: textState.content } as TextSection;
    }

    return null;
  }

  // ── Handle Add/Save (with explicit validation) ──────────────────────
  async function handleSave() {
    setErr(null);

    // Validate explicitly before building
    if (selectedType === "single" && !singleState.movement?.id) {
      setErr("Please select a movement"); return;
    }
    if (selectedType === "complex" && complexState.movements.length === 0) {
      setErr("Add at least one movement"); return;
    }
    if (selectedType === "conditioning") {
      if (!condState.format) { setErr("Select a format"); return; }
      if (condState.movements.length === 0) { setErr("Add at least one movement"); return; }
    }

    const section = buildSection();
    if (!section) return;

    if (editSection && onEdit) {
      setBusy(true);
      try {
        onEdit(section);
        onClose();
      } catch (err) {
        setErr(getErrorMessage(err, "Failed to save section"));
      } finally {
        setBusy(false);
      }
    } else {
      onAdd([section]);
      onClose();
    }
  }
        // ── Preview ────────────────────────────────────────────────────────
  const preview: string[] = (() => {
    const section = buildSection();
    if (!section) return [];
    try { return formatSection(section); } catch { return []; }
  })();

  const isEditing = Boolean(editSection);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-t-3xl border border-gray-800 bg-gray-900 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-gray-800 px-4 py-4 sm:px-6">
          <button type="button" onClick={() => { if (step !== "select-type") { setStep("select-type"); setSelectedType(null); } else onClose(); }}
            className="rounded-full border border-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-400 transition hover:border-gray-600"
          >
            {step === "select-type" ? "✕ Close" : "← Back"}
          </button>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className={step === "select-type" ? "text-[#B4E3BD] font-semibold" : ""}>Type</span>
            {step !== "select-type" && (
              <>
                <span className="text-gray-700">→</span>
                <span className="text-[#B4E3BD] font-semibold">
                  {selectedType === "single" ? "Single" : selectedType === "complex" ? "Complex" : selectedType === "conditioning" ? "Conditioning" : "Free Text"}
                </span>
              </>
            )}
          </div>
          <span className="ms-auto text-[11px] font-semibold uppercase tracking-wider text-gray-600">
            {isEditing ? "Edit section" : "New section"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {step === "select-type" && (
            <div>
              <p className="mb-4 text-sm font-semibold text-gray-300">{t("selectType")}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <TypeCard title={t("singleMovement")} desc="One lift or skill" icon="🏋️" onClick={() => chooseType("single")} active={false} />
                <TypeCard title={t("complex")} desc="Sequence of movements" icon="🔄" onClick={() => chooseType("complex")} active={false} />
                <TypeCard title={t("conditioning")} desc="AMRAP, EMOM, RFT …" icon="⏱️" onClick={() => chooseType("conditioning")} active={false} />
                <TypeCard title={t("freeText")} desc="Warm-up, notes …" icon="📝" onClick={() => chooseType("text")} active={false} />
              </div>
            </div>
          )}
          {step === "configure-single" && (
            <SingleMovementForm state={singleState} onStateChange={setSingleState} onMovementChange={(m) => setSingleState((prev) => ({ ...prev, movement: m }))} />
          )}
          {step === "configure-complex" && (
            <ComplexForm state={complexState} onStateChange={setComplexState} />
          )}
          {step === "configure-conditioning" && (
            <ConditioningForm state={condState} onStateChange={setCondState} />
          )}
          {step === "configure-text" && (
            <TextForm state={textState} onStateChange={setTextState} />
          )}

          {err && <p className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">{err}</p>}

          {step !== "select-type" && preview.length > 0 && (
            <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600">Preview</p>
              <div className="space-y-0.5">
                {preview.map((line, i) => (
                  <p key={i} className={`text-sm ${i === 0 ? "font-bold text-white" : "text-gray-400"}`}>{line || "\u00A0"}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-800 px-4 py-4 sm:px-6">
          <button type="button" onClick={onClose}
            className="rounded-full border border-gray-800 px-5 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-600"
          >{t("cancel")}</button>
          <button type="button" onClick={handleSave} disabled={busy || step === "select-type"}
            className="rounded-full bg-[#B4E3BD] px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >{busy ? (isEditing ? t("saving") : t("adding")) : isEditing ? "Save Changes" : t("add")}</button>
        </div>
      </div>
    </div>
  );
}
                

          

          
