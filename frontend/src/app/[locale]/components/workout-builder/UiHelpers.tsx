"use client";

export function TypeCard({ title, desc, icon, onClick }: {
  title: string; desc: string; icon: string; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-2xl border border-gray-800 bg-gray-950/60 p-4 text-left transition hover:border-[#B4E3BD]/60 hover:bg-gray-900 active:scale-[0.99]">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-bold text-white">{title}</span>
      <span className="text-xs text-gray-500">{desc}</span>
    </button>
  );
}

export function Field({ label, value, onChange, placeholder, textarea, type }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; textarea?: boolean; type?: string;
}) {
  const cls = "w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#B4E3BD]";
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-400">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls + " resize-y"} />
      ) : (
        <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}