"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className: string;
  required?: boolean;
  autoComplete?: string;
  showLabel: string;
  hideLabel: string;
};

export default function PasswordInput({
  id,
  value,
  onChange,
  className,
  required,
  autoComplete,
  showLabel,
  hideLabel,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        required={required}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        // Extra end-padding so typed characters never run under the icon.
        className={`${className} pe-11`}
      />

      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hideLabel : showLabel}
        // end-3 is a logical property — sits on the right in LTR and the
        // left in RTL automatically, same pattern as the rest of the site.
        className="absolute inset-y-0 end-3 flex items-center text-gray-500 transition hover:text-[#B4E3BD]"
      >
        <Image
          src={visible ? "/icons/eye-off.svg" : "/icons/eye-on.svg"}
          alt=""
          width={18}
          height={18}
        />
      </button>
    </div>
  );
}
