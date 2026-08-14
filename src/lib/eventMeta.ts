import type { BabyEvent, EventType, Settings } from "./types";
import { formatDuration } from "./time";
import { formatLength, formatTemp, formatVolume, formatWeight } from "./units";

export interface EventMeta {
  type: EventType;
  label: string;
  emoji: string;
  /** Tailwind color token used across accents (text/bg/border variants built in CSS). */
  color: string; // e.g. "amber"
  /** Whether this event tracks a duration (start + end). */
  hasDuration: boolean;
}

export const EVENT_META: Record<EventType, EventMeta> = {
  diaper: { type: "diaper", label: "Diaper", emoji: "🧷", color: "amber", hasDuration: false },
  nursing: { type: "nursing", label: "Nursing", emoji: "🤱", color: "rose", hasDuration: true },
  bottle: { type: "bottle", label: "Bottle", emoji: "🍼", color: "sky", hasDuration: false },
  pump: { type: "pump", label: "Pump", emoji: "💧", color: "teal", hasDuration: true },
  sleep: { type: "sleep", label: "Sleep", emoji: "😴", color: "indigo", hasDuration: true },
  solids: { type: "solids", label: "Solids", emoji: "🥣", color: "green", hasDuration: false },
  growth: { type: "growth", label: "Growth", emoji: "📏", color: "cyan", hasDuration: false },
  temperature: { type: "temperature", label: "Temp", emoji: "🌡️", color: "orange", hasDuration: false },
  medication: { type: "medication", label: "Meds", emoji: "💊", color: "red", hasDuration: false },
  note: { type: "note", label: "Note", emoji: "📝", color: "slate", hasDuration: false },
};

export const EVENT_ORDER: EventType[] = [
  "diaper",
  "nursing",
  "bottle",
  "sleep",
  "pump",
  "solids",
  "growth",
  "temperature",
  "medication",
  "note",
];

const SIDE_LABEL: Record<string, string> = { left: "Left", right: "Right", both: "Both" };
const DIAPER_LABEL: Record<string, string> = {
  wet: "Wet",
  dirty: "Dirty",
  mixed: "Wet + Dirty",
  dry: "Dry",
};
const CONTENTS_LABEL: Record<string, string> = {
  formula: "Formula",
  breast_milk: "Breast milk",
  mixed: "Mixed",
  water: "Water",
};

/** Human summary line for an event, unit-aware. */
export function eventSummary(e: BabyEvent, s: Settings): string {
  switch (e.type) {
    case "diaper":
      return DIAPER_LABEL[e.diaperKind] ?? "Diaper";
    case "nursing": {
      const total = e.durationSec ? formatDuration(e.durationSec) : "";
      if (e.leftSec != null && e.rightSec != null && (e.leftSec > 0 || e.rightSec > 0)) {
        const parts: string[] = [];
        if (e.leftSec > 0) parts.push(`L ${formatDuration(e.leftSec)}`);
        if (e.rightSec > 0) parts.push(`R ${formatDuration(e.rightSec)}`);
        if (total) parts.push(total);
        return parts.join(" · ");
      }
      return `${SIDE_LABEL[e.side]}${total ? ` · ${total}` : ""}`;
    }
    case "bottle":
      return `${formatVolume(e.amountMl, s.volumeUnit)} · ${CONTENTS_LABEL[e.contents]}`;
    case "pump": {
      const dur = e.endAt ? ` · ${formatDuration(Math.round((e.endAt - e.startAt) / 1000))}` : "";
      return `${formatVolume(e.amountMl, s.volumeUnit)} · ${SIDE_LABEL[e.side]}${dur}`;
    }
    case "sleep":
      return e.endAt
        ? formatDuration(Math.round((e.endAt - e.startAt) / 1000))
        : "In progress";
    case "solids":
      return [e.food, e.amount].filter(Boolean).join(" · ") || "Solids";
    case "growth": {
      const parts: string[] = [];
      if (e.weightG != null) parts.push(formatWeight(e.weightG, s.weightUnit));
      if (e.heightCm != null) parts.push(formatLength(e.heightCm, s.lengthUnit));
      if (e.headCm != null) parts.push(`head ${formatLength(e.headCm, s.lengthUnit)}`);
      return parts.join(" · ") || "Measurement";
    }
    case "temperature":
      return formatTemp(e.tempC, s.tempUnit);
    case "medication":
      return [e.name, e.dose].filter(Boolean).join(" · ") || "Medication";
    case "note":
      return e.notes || "Note";
  }
}
