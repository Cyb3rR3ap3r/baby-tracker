"use client";

import { EVENT_META, eventSummary } from "@/lib/eventMeta";
import { colorClasses } from "@/lib/colors";
import { useStore } from "@/lib/store";
import { useLog } from "./LogProvider";
import { formatClock } from "@/lib/time";
import type { BabyEvent } from "@/lib/types";

export function EventRow({ event }: { event: BabyEvent }) {
  const { settings } = useStore();
  const { edit } = useLog();
  const meta = EVENT_META[event.type];
  const c = colorClasses(meta.color);

  return (
    <button
      onClick={() => edit(event)}
      className="group flex w-full items-center gap-3 rounded-2xl bg-surface px-3.5 py-3 text-left ring-1 ring-border transition hover:ring-brand/40"
    >
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl ${c.soft}`}>
        {meta.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-bold">{meta.label}</span>
          <span className="truncate text-sm text-muted">{eventSummary(event, settings)}</span>
        </div>
        {event.notes && (
          <p className="truncate text-sm text-muted">{event.notes}</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold tabular-nums">{formatClock(event.startAt)}</div>
        {event.type === "sleep" && !event.endAt && (
          <div className="text-xs font-semibold text-indigo-500">ongoing</div>
        )}
      </div>
    </button>
  );
}
