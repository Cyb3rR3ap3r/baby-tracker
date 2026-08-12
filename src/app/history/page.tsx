"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { EventRow } from "@/components/EventRow";
import { EVENT_META, EVENT_ORDER } from "@/lib/eventMeta";
import { dayKey, dayLabel } from "@/lib/time";
import type { BabyEvent, EventType } from "@/lib/types";

export default function HistoryPage() {
  const { ready, events } = useStore();
  const [filter, setFilter] = useState<EventType | "all">("all");

  const filtered = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.type === filter)),
    [events, filter]
  );

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">History</h1>
        <p className="text-sm text-muted">Every entry, newest first.</p>
      </header>

      {/* Filter chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </Chip>
        {EVENT_ORDER.map((t) => (
          <Chip key={t} active={filter === t} onClick={() => setFilter(t)}>
            <span aria-hidden>{EVENT_META[t].emoji}</span> {EVENT_META[t].label}
          </Chip>
        ))}
      </div>

      {!ready ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-muted">
          <div className="text-3xl">📭</div>
          <p className="mt-2 font-semibold">No entries yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="mb-2 flex items-baseline justify-between">
                <span className="font-bold">{dayLabel(g.items[0].startAt)}</span>
                <span className="text-xs font-semibold text-muted">
                  {g.items.length} {g.items.length === 1 ? "entry" : "entries"}
                </span>
              </h2>
              <div className="space-y-2">
                {g.items.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
        active
          ? "border-brand bg-brand text-white"
          : "border-border bg-surface text-muted hover:border-brand/40"
      }`}
    >
      {children}
    </button>
  );
}

function groupByDay(events: BabyEvent[]) {
  const map = new Map<string, BabyEvent[]>();
  for (const e of events) {
    const k = dayKey(e.startAt);
    const arr = map.get(k);
    if (arr) arr.push(e);
    else map.set(k, [e]);
  }
  return Array.from(map.entries())
    .map(([key, items]) => ({ key, items }))
    .sort((a, b) => b.items[0].startAt - a.items[0].startAt);
}
