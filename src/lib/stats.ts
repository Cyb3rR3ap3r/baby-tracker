import type { BabyEvent, EventType } from "./types";
import { dayKey, startOfDay } from "./time";

/** Most recent event of a given type. Events are stored newest-first. */
export function lastOfType(events: BabyEvent[], type: EventType): BabyEvent | undefined {
  return events.find((e) => e.type === type);
}

export interface DayTotals {
  diapers: number;
  wet: number;
  dirty: number;
  feeds: number; // nursing + bottle sessions
  bottleMl: number;
  nursingMin: number;
  sleepMin: number;
  pumpMl: number;
}

export function totalsForDay(events: BabyEvent[], dayStart: number): DayTotals {
  const key = dayKey(dayStart);
  const t: DayTotals = {
    diapers: 0,
    wet: 0,
    dirty: 0,
    feeds: 0,
    bottleMl: 0,
    nursingMin: 0,
    sleepMin: 0,
    pumpMl: 0,
  };
  for (const e of events) {
    if (dayKey(e.startAt) !== key) continue;
    switch (e.type) {
      case "diaper":
        t.diapers++;
        if (e.diaperKind === "wet" || e.diaperKind === "mixed") t.wet++;
        if (e.diaperKind === "dirty" || e.diaperKind === "mixed") t.dirty++;
        break;
      case "bottle":
        t.feeds++;
        t.bottleMl += e.amountMl;
        break;
      case "nursing":
        t.feeds++;
        t.nursingMin += (e.durationSec ?? 0) / 60;
        break;
      case "sleep":
        if (e.endAt) t.sleepMin += (e.endAt - e.startAt) / 60000;
        break;
      case "pump":
        t.pumpMl += e.amountMl;
        break;
    }
  }
  return t;
}

/** Build daily buckets for the last `days` days (oldest → newest). */
export function lastNDays(
  events: BabyEvent[],
  days: number
): { dayStart: number; totals: DayTotals }[] {
  const today = startOfDay(Date.now());
  const out: { dayStart: number; totals: DayTotals }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = today - i * 86400000;
    out.push({ dayStart, totals: totalsForDay(events, dayStart) });
  }
  return out;
}
