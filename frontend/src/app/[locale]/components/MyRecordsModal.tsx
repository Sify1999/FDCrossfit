"use client";

import RecordsEditor from "./RecordsEditor";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MyRecordsModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <RecordsEditor
        getUrl="/athlete-records/me"
        putUrl="/athlete-records/me"
        eyebrow="Personal Log"
        title="My Records"
        subtitle="Enter your maximum lifts. Weight is measured in kilograms."
        onDone={onClose}
        doneLabel="Cancel"
      />
    </div>
  );
}