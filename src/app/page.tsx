"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useLog } from "@/components/LogProvider";
import { EventRow } from "@/components/EventRow";
import { EVENT_META } from "@/lib/eventMeta";
import { colorClasses } from "@/lib/colors";
import { babyAge, formatDuration, startOfDay, timeAgo } from "@/lib/time";
import { lastOfType, totalsForDay } from "@/lib/stats";
import { formatVolume } from "@/lib/units";
import type { EventType } from "@/lib/types";

const QUICK: EventType[] = ["diaper", "nursing", "bottle", "sleep", "pump", "solids"];

export default function Dashboard() {
  const { ready, events, baby, settings } = useStore();
  const { log, openPicker } = useLog();

  // Live "time since" ticking.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const today = useMemo(() => totalsForDay(events, startOfDay(now)), [events, now]);
  const todaysEvents = useMemo(() => {
    const start = startOfDay(now);
    return events.filter((e) => e.startAt >= start);
  }, [events, now]);

  const lastFeed = useMemo(() => {
    const bottle = lastOfType(events, "bottle");
    const nursing = lastOfType(events, "nursing");
    if (!bottle) return nursing;
    if (!nursing) return bottle;
    return bottle.startAt >= nursing.startAt ? bottle : nursing;
  }, [events]);
  const lastDiaper = useMemo(() => lastOfType(events, "diaper"), [events]);
  const lastSleep = useMemo(() => lastOfType(events, "sleep"), [events]);

  if (!ready) return <DashboardSkeleton />;

  const age = babyAge(baby.birthDate, now);
  const greeting = getGreeting(now);
  const feedTotal =
    today.bottleMl > 0 ? formatVolume(today.bottleMl, settings.volumeUnit) : `${today.feeds}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted">{greeting}</p>
          <h1 className="truncate text-2xl font-extrabold tracking-tight">
            {baby.name ? baby.name : "Little Log"}
          </h1>
          {age && <p className="text-sm text-muted">{age}</p>}
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-2xl">
          🍼
        </span>
      </header>

      {/* Since last */}
      <section className="grid grid-cols-3 gap-3">
        <SinceCard label="Last feed" meta="bottle" ts={lastFeed?.startAt} now={now} />
        <SinceCard label="Last diaper" meta="diaper" ts={lastDiaper?.startAt} now={now} />
        <SinceCard
          label={lastSleep && !lastSleep.endAt ? "Sleeping" : "Last sleep"}
          meta="sleep"
          ts={lastSleep?.startAt}
          now={now}
        />
      </section>

      {/* Quick add */}
      <section>
        <SectionTitle>Quick log</SectionTitle>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {QUICK.map((type) => {
            const meta = EVENT_META[type];
            const c = colorClasses(meta.color);
            return (
              <button
                key={type}
                onClick={() => log(type)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition active:scale-95 ${c.tile}`}
              >
                <span className="text-2xl" aria-hidden>
                  {meta.emoji}
                </span>
                <span className="text-xs font-semibold text-foreground">{meta.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Today summary */}
      <section>
        <SectionTitle>Today at a glance</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile emoji="🧷" label="Diapers" value={String(today.diapers)} sub={`${today.wet}💦 ${today.dirty}💩`} />
          <StatTile emoji="🍼" label="Feeds" value={String(today.feeds)} sub={today.bottleMl > 0 ? feedTotal : "sessions"} />
          <StatTile emoji="😴" label="Sleep" value={formatDuration(today.sleepMin * 60)} sub="total" />
          <StatTile emoji="💧" label="Pumped" value={formatVolume(today.pumpMl, settings.volumeUnit)} sub="today" />
        </div>
      </section>

      {/* Timeline */}
      <section>
        <SectionTitle>Today&rsquo;s timeline</SectionTitle>
        {todaysEvents.length === 0 ? (
          <EmptyState onAdd={openPicker} />
        ) : (
          <div className="space-y-2">
            {todaysEvents.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2.5 text-sm font-bold uppercase tracking-wide text-muted">{children}</h2>;
}

function SinceCard({
  label,
  meta,
  ts,
  now,
}: {
  label: string;
  meta: EventType;
  ts?: number;
  now: number;
}) {
  const m = EVENT_META[meta];
  const c = colorClasses(m.color);
  return (
    <div className="rounded-2xl bg-surface p-3 ring-1 ring-border">
      <div className={`mb-2 grid h-8 w-8 place-items-center rounded-full text-base ${c.soft}`}>
        {m.emoji}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 text-sm font-bold leading-tight">
        {ts ? timeAgo(ts, now) : "—"}
      </div>
    </div>
  );
}

function StatTile({
  emoji,
  label,
  value,
  sub,
}: {
  emoji: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-border">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-muted">
        <span aria-hidden>{emoji}</span>
        {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-10 text-center">
      <div className="text-4xl">🌙</div>
      <p className="mt-2 font-semibold">Nothing logged yet today</p>
      <p className="mt-1 text-sm text-muted">Tap the + button to record the first entry.</p>
      <button
        onClick={onAdd}
        className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-105"
      >
        Log an entry
      </button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-14 rounded-2xl bg-surface" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-surface" />
        ))}
      </div>
      <div className="h-28 rounded-2xl bg-surface" />
      <div className="h-40 rounded-2xl bg-surface" />
    </div>
  );
}

function getGreeting(now: number) {
  const h = new Date(now).getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}
