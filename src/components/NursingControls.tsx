"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { liveTotals, type NursingSide } from "@/lib/nursing";
import { clockDuration } from "@/lib/time";

/**
 * The live nursing control cluster: per-side stopwatches with switch / pause /
 * finish. Used both in the global bar and inside the Nursing sheet.
 */
export function NursingControls({
  onFinished,
  compact = false,
}: {
  onFinished?: () => void;
  compact?: boolean;
}) {
  const { activeNursing, nursing } = useStore();
  const [now, setNow] = useState(() => Date.now());

  // Tick every second while a session is running.
  useEffect(() => {
    if (!activeNursing?.running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeNursing?.running]);

  if (!activeNursing) return null;
  const s = activeNursing;
  const t = liveTotals(s, now);

  const handleSide = (side: NursingSide) => {
    if (s.side === side) {
      nursing(s.running ? "pause" : "resume", side);
    } else {
      nursing("switch", side);
    }
  };

  return (
    <div className={compact ? "space-y-2.5" : "space-y-4"}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold">
          <span aria-hidden>🤱</span>
          <span>Nursing</span>
          {!s.running && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
              paused
            </span>
          )}
        </div>
        <div className="text-sm font-bold tabular-nums text-muted">
          Total {clockDuration(t.total)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <SideButton side="left" label="Left" seconds={t.left} session={s} onClick={handleSide} />
        <SideButton side="right" label="Right" seconds={t.right} session={s} onClick={handleSide} />
      </div>

      <div className="flex gap-2.5">
        <button
          onClick={() => nursing(s.running ? "pause" : "resume", s.side)}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold transition hover:border-brand/50 active:scale-[0.99]"
        >
          {s.running ? "⏸ Pause" : "▶ Resume"}
        </button>
        <button
          onClick={() => {
            nursing("complete");
            onFinished?.();
          }}
          className="flex-[1.4] rounded-xl bg-brand px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-105 active:scale-[0.99]"
        >
          ✓ Finish &amp; log
        </button>
      </div>

      <button
        onClick={() => {
          if (confirm("Discard this nursing session without saving?")) {
            nursing("discard");
            onFinished?.();
          }
        }}
        className="w-full py-1 text-xs font-semibold text-muted transition hover:text-red-500"
      >
        Discard
      </button>
    </div>
  );
}

function SideButton({
  side,
  label,
  seconds,
  session,
  onClick,
}: {
  side: NursingSide;
  label: string;
  seconds: number;
  session: { side: NursingSide; running: boolean };
  onClick: (s: NursingSide) => void;
}) {
  const isCurrent = session.side === side;
  const live = isCurrent && session.running;
  return (
    <button
      onClick={() => onClick(side)}
      className={`relative rounded-2xl border p-3 text-center transition active:scale-[0.98] ${
        isCurrent
          ? "border-brand bg-brand/10"
          : "border-border bg-background hover:border-brand/40"
      }`}
    >
      {live && (
        <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
        </span>
      )}
      <div className="text-xs font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 text-2xl font-extrabold tabular-nums">{clockDuration(seconds)}</div>
      <div className="mt-0.5 text-[11px] font-semibold text-muted">
        {isCurrent ? (session.running ? "tap to pause" : "tap to resume") : "tap to switch"}
      </div>
    </button>
  );
}
