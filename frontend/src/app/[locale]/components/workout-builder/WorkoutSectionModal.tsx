"use client";
import { useState, useEffect } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
import MovementPicker from "./MovementPicker";
import CondMovementRow from "./CondMovementRow";
import { TypeCard, Field } from "./UiHelpers";
import type { Movement, WorkoutSection, MovementRowData } from "./types";
import { formatSection, newSectionId } from "./section-formatter";

const FORMATS = ["AMRAP","EMOM","FOR_TIME","RFT","TABATA","CHIPPER"] as const;
function dr(): MovementRowData {
  return { movement_id: null, movement_name: "", reps: "", unit: "reps", weight: null };
}
type Props = { open: boolean; onClose: () => void; onAdd: (s: WorkoutSection[]) => void; };

export default function WorkoutSectionModal({ open, onClose, onAdd }: Props) {
  const [step, setStep] = useState("select-type");
  const [type, setType] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mov, setMov] = useState<Movement | null>(null);
  const [sSets, sSS] = useState(""); const [sReps, sSR] = useState(""); const [sW, sSW] = useState(""); const [sR, sSRs] = useState(""); const [sT, sST] = useState(""); const [sN, sSN] = useState(""); const [sL, sSL] = useState("");
  const [cq, sCQ] = useState(""); const [cr, sCR] = useState<any[]>([]); const [cId, sCID] = useState<number|null>(null);
  const [cNm, sCNm] = useState(""); const [cMv, sCMv] = useState<MovementRowData[]>([]); const [cSets, sCS] = useState(""); const [cW, sCW] = useState(""); const [cR, sCRs] = useState(""); const [cN, sCN] = useState(""); const [cL, sCLb] = useState("");
  const [cNew, sCNew] = useState(false); const [cNewNm, cNewNmS] = useState(""); const [cSv, sCSv] = useState(false); const [cSaving, sCSg] = useState(false);
  const [cf, sCF] = useState<"AMRAP"|"EMOM"|"FOR_TIME"|"RFT"|"TABATA"|"CHIPPER"|null>(null); const [cDur, sCD] = useState(""); const [cInt, sCI] = useState(""); const [cTC, sCTC] = useState(""); const [cRnd, sCRnd] = useState(""); const [cWS, sCWS] = useState(""); const [cRS, sCRS] = useState(""); const [cMv2, sCMv2] = useState<MovementRowData[]>([]); const [cN2, sCN2] = useState(""); const [cL2, sCL2] = useState("");
  const [tL, sTL] = useState(""); const [tC, sTC] = useState("");
  useEffect(() => {
    if (!open) return;
    setStep("select-type"); setType(null); setErr(null); setBusy(false); setMov(null);
    sSS(""); sSR(""); sSW(""); sSRs(""); sST(""); sSN(""); sSL("");
    sCQ(""); sCR([]); sCID(null); sCNm(""); sCMv([]); sCS(""); sCW(""); sCRs(""); sCN(""); sCLb("");
    sCNew(false); cNewNmS(""); sCSv(false); sCSg(false);
    sCF(null); sCD(""); sCI(""); sCTC(""); sCRnd(""); sCWS(""); sCRS(""); sCMv2([]); sCN2(""); sCL2("");
    sTL(""); sTC("");
  }, [open]);

  useEffect(() => {
    if (!cq.trim()) { sCR([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try { const d = await api.get<any[]>("/complexes?q=" + encodeURIComponent(cq.trim())); if (!cancelled) sCR(d); }
      catch {} finally {}
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [cq]);

  function selComp(x: any) {
    sCID(x.id); sCNm(x.name);
    sCMv((x.movements||[]).map((m: any) => ({
      movement_id: m.movement_id, movement_name: m.movement_name, reps: m.reps||"", unit: "reps", weight: null
    })));
  }

  function buildPure(): WorkoutSection | null {
    const id = newSectionId();
    if (type === "single") {
      if (!mov?.id) return null;
      return { id, type: "single", label: sL || mov.name, movement_id: mov.id, movement_name: mov.name,
        sets: sSets ? parseInt(sSets)||null : null, reps: sReps||null, weight: sW||null,
        rest_seconds: sR ? parseInt(sR)||null : null, tempo: sT||null, notes: sN||null, content: "" };
    }
    if (type === "complex") {
      const e = cMv.filter((x: any) => x.movement_id);
      if (!e.length) return null;
      return { id, type: "complex", label: cL || cNm || cNewNm || "Complex", complex_id: cId,
        complex_name: cNm || cNewNm || "Complex",
        movements: e.map((x: any) => ({ movement_id: x.movement_id!, movement_name: x.movement_name, reps: x.reps||"1", unit: x.unit, weight: x.weight })),
        sets: cSets ? parseInt(cSets)||null : null, weight: cW||null,
        rest_seconds: cR ? parseInt(cR)||null : null, notes: cN||null, content: "" };
    }
    if (type === "conditioning") {
      if (!cf) return null;
      const e = cMv2.filter((x: any) => x.movement_id);
      if (!e.length) return null;
      return { id, type: "conditioning", label: cL2 || cf || "Metcon", format: cf,
        duration_minutes: cDur ? parseInt(cDur)||null : null, interval_minutes: cInt ? parseInt(cInt)||null : null,
        time_cap_minutes: cTC ? parseInt(cTC)||null : null, rounds: cRnd ? parseInt(cRnd)||null : null,
        work_seconds: cWS ? parseInt(cWS)||null : null, rest_seconds_interval: cRS ? parseInt(cRS)||null : null,
        movements: e.map((x: any) => ({ movement_id: x.movement_id!, movement_name: x.movement_name, reps: x.reps||"", unit: x.unit||"reps", weight: x.weight })),
        notes: cN2||null, content: "" };
    }
    if (type === "text") return { id, type: "text", label: tL || "Notes", content: tC };
    return null;
  }

  async function handleAdd() {
    setErr(null);
    if (type === "single" && !mov?.id) { setErr("Select a movement"); return; }
    if (type === "complex") {
      const e = cMv.filter((x: any) => x.movement_id);
      if (!e.length) { setErr("Add at least one movement"); return; }
      if (cSv && cNewNm.trim()) {
        sCSg(true);
        try { await api.post("/complexes", { name: cNewNm.trim(), movements: e.map((x: any) => ({ movement_id: x.movement_id, movement_name: x.movement_name, reps: x.reps||"1" })) }); }
        catch (e) { setErr(getErrorMessage(e, "Failed to save complex")); sCSg(false); return; }
        sCSg(false);
      }
    }
    if (type === "conditioning") {
      if (!cf) { setErr("Select a format"); return; }
      const e = cMv2.filter((x: any) => x.movement_id);
      if (!e.length) { setErr("Add at least one movement"); return; }
    }
    const section = buildPure(); if (!section) return;
    setBusy(true);
    setTimeout(() => { onAdd([section]); setBusy(false); onClose(); }, 0);
  }

  const preview = (() => { const s = buildPure(); return s ? formatSection(s) : []; })();
  const title = step === "select-type" ? "Add Section" : step === "configure-single" ? "Single Movement" : step === "configure-complex" ? (cNew ? "Create Complex" : "Select Complex") : step === "configure-conditioning" ? (cf || "Conditioning") : "Free Text";
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 sm:p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-4 sm:px-6">
          <div>
            {step !== "select-type" && (
              <button type="button" onClick={() => setStep("select-type")}
                className="mb-1 flex items-center gap-1 text-xs text-gray-500 transition hover:text-gray-300">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>Back
              </button>
            )}
            <h2 className="text-lg font-bold text-white">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            className="rounded-full border border-gray-800 p-2 text-gray-400 transition hover:border-red-400 hover:text-red-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 coach-scroll">
          {err && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">{err}</div>}

          {step === "select-type" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TypeCard title="Single Movement" desc="Strength or accessory" icon="💪" onClick={() => { setType("single"); setStep("configure-single"); }} />
              <TypeCard title="Complex" desc="Multiple as one sequence" icon="🔗" onClick={() => { setType("complex"); setStep("configure-complex"); }} />
              <TypeCard title="Conditioning" desc="AMRAP, EMOM, etc." icon="🔥" onClick={() => { setType("conditioning"); setStep("configure-conditioning"); }} />
              <TypeCard title="Free Text" desc="Any custom content" icon="📝" onClick={() => { setType("text"); setStep("configure-text"); }} />
            </div>
          )}

          {step === "configure-single" && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-gray-400">Select Movement</label>
              <MovementPicker value={mov} onChange={(x) => { setMov(x); setErr(null); }} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Sets" value={sSets} onChange={sSS} placeholder="5" />
                <Field label="Reps" value={sReps} onChange={sSR} placeholder="5" />
                <Field label="Weight" value={sW} onChange={sSW} placeholder="80kg" />
                <Field label="Rest (sec)" value={sR} onChange={sSRs} placeholder="120" type="number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tempo" value={sT} onChange={sST} placeholder="Optional" />
                <Field label="Title" value={sL} onChange={sSL} placeholder={mov?.name || "Strength"} />
              </div>
              <Field label="Notes" value={sN} onChange={sSN} textarea />
            </div>
          )}

          {step === "configure-complex" && !cNew && (
            <div className="space-y-4">
              <input type="text" value={cq} onChange={e => sCQ(e.target.value)} placeholder="Search complexes..."
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]" />
              {cr.map((x: any) => (
                <button key={x.id} type="button" onClick={() => selComp(x)}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-left text-sm text-white hover:border-[#B4E3BD]/60">
                  <span className="flex-1 font-medium">{x.name}</span>
                  <span className="text-xs text-gray-500">{x.movements?.length||0} movements</span></button>
              ))}
              <button type="button" onClick={() => sCNew(true)}
                className="w-full rounded-xl border border-dashed border-gray-800 py-3 text-sm font-semibold text-[#B4E3BD] transition hover:border-[#B4E3BD]/50">+ Create New Complex</button>
            </div>
          )}

          {step === "configure-complex" && cNew && (
            <div className="space-y-4">
              <Field label="Name" value={cNewNm} onChange={cNewNmS} placeholder="e.g. Clean Complex" />
              <p className="text-sm font-semibold text-gray-300">Movements</p>
              {cMv.map((x: any, i: number) => (
                <CondMovementRow key={i} data={x}
                  onChange={(f, v) => sCMv((p: any) => p.map((r: any, j: number) => j === i ? { ...r, [f]: v } : r))}
                  onRemove={() => sCMv((p: any) => p.filter((_: any, j: number) => j !== i))} />
              ))}
              <button type="button" onClick={() => sCMv((p: any) => [...p, dr()])}
                className="w-full rounded-xl border border-dashed border-gray-800 py-2 text-sm text-gray-400 transition hover:border-[#B4E3BD]/50 hover:text-[#B4E3BD]">+ Add Movement</button>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input type="checkbox" checked={cSv} onChange={e => sCSv(e.target.checked)} className="rounded border-gray-800 bg-gray-950 text-[#B4E3BD]" /> Save for future</label>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Sets" value={cSets} onChange={sCS} placeholder="5" />
                <Field label="Weight" value={cW} onChange={sCW} placeholder="60kg" />
                <Field label="Rest (sec)" value={cR} onChange={sCRs} placeholder="120" type="number" />
              </div>
              <Field label="Title" value={cL} onChange={sCLb} placeholder={cNewNm || "Complex"} />
              <Field label="Notes" value={cN} onChange={sCN} textarea />
            </div>
          )}

          {step === "configure-conditioning" && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-300">Format</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {FORMATS.map((f) => (
                  <button key={f} type="button" onClick={() => sCF(f)}
                    className={"rounded-xl border px-2 py-3 text-center text-xs font-bold uppercase tracking-wider transition " + (cf === f ? "border-[#B4E3BD] bg-[#B4E3BD]/10 text-[#B4E3BD]" : "border-gray-800 text-gray-400 hover:border-gray-600")}>
                    {f === "FOR_TIME" ? "FOR\nTIME" : f}</button>
                ))}
              </div>
              {cf && (<>
                {cf === "AMRAP" && <Field label="Duration (min)" value={cDur} onChange={sCD} placeholder="20" type="number" />}
                {cf === "EMOM" && <div className="grid grid-cols-2 gap-3"><Field label="Duration (min)" value={cDur} onChange={sCD} placeholder="20" type="number" /><Field label="Interval (min)" value={cInt} onChange={sCI} placeholder="1" type="number" /></div>}
                {cf === "FOR_TIME" && <Field label="Time Cap (min)" value={cTC} onChange={sCTC} placeholder="15" type="number" />}
                {cf === "RFT" && <Field label="Rounds" value={cRnd} onChange={sCRnd} placeholder="5" type="number" />}
                {cf === "TABATA" && <div className="grid grid-cols-3 gap-3"><Field label="Work (sec)" value={cWS} onChange={sCWS} placeholder="20" type="number" /><Field label="Rest (sec)" value={cRS} onChange={sCRS} placeholder="10" type="number" /><Field label="Rounds" value={cRnd} onChange={sCRnd} placeholder="8" type="number" /></div>}
                {cf === "CHIPPER" && <p className="text-xs text-gray-500">Ordered list, performed once</p>}
                <p className="text-sm font-semibold text-gray-300">Movements</p>
                {cMv2.map((x: any, i: number) => (
                  <CondMovementRow key={i} data={x} onChange={(f, v) => sCMv2((p: any) => p.map((r: any, j: number) => j === i ? { ...r, [f]: v } : r))} onRemove={() => sCMv2((p: any) => p.filter((_: any, j: number) => j !== i))} />
                ))}
                <button type="button" onClick={() => sCMv2((p: any) => [...p, dr()])}
                  className="w-full rounded-xl border border-dashed border-gray-800 py-2 text-sm text-gray-400 transition hover:border-[#B4E3BD]/50 hover:text-[#B4E3BD]">+ Add Movement</button>
                <Field label="Title" value={cL2} onChange={sCL2} placeholder={cf || "Metcon"} />
                <Field label="Notes" value={cN2} onChange={sCN2} textarea />
              </>)}
            </div>
          )}

          {step === "configure-text" && (
            <div className="space-y-4">
              <Field label="Title" value={tL} onChange={sTL} placeholder="e.g. Warm Up" />
              <div><label className="mb-1 block text-xs font-semibold text-gray-400">Content</label>
                <textarea value={tC} onChange={e => sTC(e.target.value)} placeholder="e.g. 10 min easy bike..." rows={8}
                  className="w-full resize-y rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]" /></div>
            </div>
          )}
        </div>

        {step !== "select-type" && preview.length > 0 && (
          <div className="border-t border-gray-800 px-4 py-3 sm:px-6">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Preview</p>
            <div className="rounded-xl border border-gray-800 bg-gray-950/60 px-3 py-2.5">
              {preview.map((line: string, i: number) => (
                <p key={i} className={"text-sm " + (i === 0 ? "font-bold text-white" : "text-gray-400")}>{line || "\u00A0"}</p>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-800 px-4 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="rounded-full border border-gray-800 px-5 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-600">Cancel</button>
          <button type="button" onClick={handleAdd} disabled={busy || cSaving}
            className="rounded-full bg-[#B4E3BD] px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? "Adding..." : cSaving ? "Saving..." : "Add Section"}</button>
        </div>
      </div>
    </div>
  );
}
