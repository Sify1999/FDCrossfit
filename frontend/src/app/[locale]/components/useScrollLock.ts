"use client";

import { useEffect } from "react";

/**
 * Locks body scroll when the modal is open. Restores scroll on cleanup.
 */
export function useBodyScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);
}