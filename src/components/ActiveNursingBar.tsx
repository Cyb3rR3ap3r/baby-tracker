"use client";

import { useStore } from "@/lib/store";
import { NursingControls } from "./NursingControls";

/** Sticky banner shown on every page while a nursing session is in progress. */
export function ActiveNursingBar() {
  const { activeNursing } = useStore();
  if (!activeNursing) return null;
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto w-full max-w-2xl">
        <NursingControls compact />
      </div>
    </div>
  );
}
