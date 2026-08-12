"use client";

import { useEffect } from "react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/** A responsive dialog: bottom-sheet on mobile, centered card on desktop. */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade"
        onClick={onClose}
      />
      <div className="relative z-10 w-full sm:max-w-lg animate-sheet">
        <div className="mx-auto max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-surface shadow-2xl ring-1 ring-border sm:m-4">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface/95 px-5 py-4 backdrop-blur">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-black/5 dark:hover:bg-white/10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div className="px-5 py-5 pb-safe">{children}</div>
        </div>
      </div>
    </div>
  );
}
