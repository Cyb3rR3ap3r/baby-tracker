"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { lastNDays } from "@/lib/stats";
import { formatVolume } from "@/lib/units";
import { formatDuration } from "@/lib/time";

type Range = 7 | 14 | 30;

export default function StatsPage() {
  const { ready, events, settings } = useStore();
  const [range, setRange] = useState<Range>(7);

  const days = useMemo(() => lastNDays(events, range), [events, range]);

  const summary = useMemo(() => {
    const withData = days.filter(
      (d) => d.totals.diapers || d.totals.feeds || d.totals.sleepMin || d.totals.bottleMl
    );
    const n = Math.max(1, withData.length);
    const sum = days.reduce(
      (a, d) => ({
        diapers: a.diapers + d.totals.diapers,
        feeds: a.feeds + d.totals.feeds,
        sleepMin: a.sleepMin + d.totals.sleepMin,
        bottleMl: a.bottleMl + d.totals.bottleMl,
      }),
      { diapers: 0, feeds: 0, sleepMin: 0, bottleMl: 0 }
    );
    return {
      avgDiapers: sum.diapers / n,
      avgFeeds: sum.feeds / n,
      avgSleep: sum.sleepMin / n,
      avgBottle: sum.bottleMl / n,
    };
  }, [days]);

  const labels = days.map((d) =>
    new Date(d.dayStart).toLocaleDateString([], { weekday: "narrow" })
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Stats</h1>
          <p className="text-sm text-muted">Trends & daily averages.</p>
        </div>
      </header>

      {/* Range selector */}
      <div className="inline-flex rounded-xl border border-border bg-surface p-1">
        {([7, 14, 30] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
              range === r ? "bg-brand text-white" : "text-muted"
            }`}
          >
            {r}d
          </button>
        ))}
      </div>

      {!ready ? (
        <div className="h-64 animate-pulse rounded-2xl bg-surface" />
      ) : (
        <>
          {/* Averages */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Avg emoji="🧷" label="Diapers / day" value={summary.avgDiapers.toFixed(1)} />
            <Avg emoji="🍼" label="Feeds / day" value={summary.avgFeeds.toFixed(1)} />
            <Avg emoji="😴" label="Sleep / day" value={formatDuration(summary.avgSleep * 60)} />
            <Avg
              emoji="🥛"
              label="Bottle / day"
              value={summary.avgBottle > 0 ? formatVolume(summary.avgBottle, settings.volumeUnit) : "—"}
            />
          </section>

          <BarChart
            title="Diapers per day"
            color="amber"
            labels={labels}
            values={days.map((d) => d.totals.diapers)}
            format={(v) => String(Math.round(v))}
          />
          <BarChart
            title="Feeds per day"
            color="rose"
            labels={labels}
            values={days.map((d) => d.totals.feeds)}
            format={(v) => String(Math.round(v))}
          />
          <BarChart
            title="Sleep per day (hours)"
            color="indigo"
            labels={labels}
            values={days.map((d) => d.totals.sleepMin / 60)}
            format={(v) => `${v.toFixed(1)}h`}
          />
          {days.some((d) => d.totals.bottleMl > 0) && (
            <BarChart
              title={`Bottle intake per day (${settings.volumeUnit})`}
              color="sky"
              labels={labels}
              values={days.map((d) =>
                settings.volumeUnit === "oz" ? d.totals.bottleMl / 29.5735 : d.totals.bottleMl
              )}
              format={(v) => (settings.volumeUnit === "oz" ? v.toFixed(1) : String(Math.round(v)))}
            />
          )}
        </>
      )}
    </div>
  );
}

function Avg({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-border">
      <div className="text-sm font-semibold text-muted">
        <span aria-hidden className="mr-1">
          {emoji}
        </span>
        {label}
      </div>
      <div className="mt-1 text-xl font-extrabold tabular-nums">{value}</div>
    </div>
  );
}

const BAR_COLOR: Record<string, string> = {
  amber: "#fbbf24",
  rose: "#fb7185",
  indigo: "#818cf8",
  sky: "#38bdf8",
};

function BarChart({
  title,
  color,
  labels,
  values,
  format,
}: {
  title: string;
  color: string;
  labels: string[];
  values: number[];
  format: (v: number) => string;
}) {
  const CHART_H = 140;
  const max = Math.max(1, ...values);
  const fill = BAR_COLOR[color] ?? "#818cf8";
  return (
    <section className="rounded-2xl bg-surface p-4 ring-1 ring-border">
      <h2 className="mb-4 text-sm font-bold">{title}</h2>
      <div className="flex items-end gap-1.5" style={{ height: CHART_H }}>
        {values.map((v, i) => {
          const h = max > 0 ? (v / max) * CHART_H : 0;
          return (
            <div key={i} className="flex flex-1 flex-col items-center justify-end">
              {v > 0 && (
                <span className="mb-1 text-[10px] font-bold tabular-nums text-muted">
                  {format(v)}
                </span>
              )}
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: Math.max(v > 0 ? 4 : 0, h),
                  backgroundColor: v > 0 ? fill : "transparent",
                }}
                title={format(v)}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 text-center text-[10px] font-semibold text-muted">
            {l}
          </span>
        ))}
      </div>
    </section>
  );
}
