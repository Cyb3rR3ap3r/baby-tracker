"use client";

import { useMemo, useState } from "react";
import { Sheet } from "./Sheet";
import { Field, PrimaryButton, Segmented, Stepper, TextArea, TextInput } from "./form";
import { NursingControls } from "./NursingControls";
import { EVENT_META } from "@/lib/eventMeta";
import { useStore } from "@/lib/store";
import type { BabyEvent, EventType } from "@/lib/types";
import { fromDatetimeLocal, toDatetimeLocal } from "@/lib/time";
import {
  displayToCm,
  displayToMl,
  displayToC,
  displayToWeightG,
  lengthToDisplay,
  mlToDisplay,
  cToDisplay,
  volumeLabel,
  weightToDisplay,
} from "@/lib/units";

interface Props {
  type: EventType;
  event?: BabyEvent;
  onClose: () => void;
}

// A loosely typed working draft so one component can edit every event shape.
type Draft = Record<string, unknown> & { startAt: number };

export function LogSheet({ type, event, onClose }: Props) {
  const { settings, addEvent, updateEvent, deleteEvent, activeNursing, nursing } = useStore();
  const meta = EVENT_META[type];
  const editing = !!event;

  // New nursing entries default to the live timer; editing is always manual.
  const [nursingMode, setNursingMode] = useState<"timer" | "manual">("timer");
  const showTimer = type === "nursing" && !editing && nursingMode === "timer";

  const [draft, setDraft] = useState<Draft>(() => initialDraft(type, event, settings));
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const startLocal = useMemo(() => toDatetimeLocal(draft.startAt), [draft.startAt]);

  function handleSave() {
    const payload = buildPayload(type, draft, settings);
    if (editing && event) {
      updateEvent(event.id, payload as Partial<BabyEvent>);
    } else {
      addEvent({ type, ...payload } as Omit<BabyEvent, "id" | "createdAt" | "updatedAt">);
    }
    onClose();
  }

  return (
    <Sheet open onClose={onClose} title={`${editing ? "Edit" : "Log"} ${meta.label} ${meta.emoji}`}>
      <div className="space-y-5">
        {type === "nursing" && !editing && (
          <Segmented
            columns={2}
            value={nursingMode}
            onChange={(v) => setNursingMode(v as "timer" | "manual")}
            options={[
              { value: "timer", label: "Live timer", emoji: "⏱️" },
              { value: "manual", label: "Manual", emoji: "✏️" },
            ]}
          />
        )}

        {showTimer &&
          (activeNursing ? (
            <NursingControls onFinished={onClose} />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Start a side to begin timing. The session keeps running even if you close this or
                lock your phone, and shows at the top of every screen until you finish it.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    nursing("start", "left");
                    onClose();
                  }}
                  className="rounded-2xl border border-brand bg-brand/10 px-3 py-5 text-base font-bold transition active:scale-[0.98]"
                >
                  ▶ Start left
                </button>
                <button
                  onClick={() => {
                    nursing("start", "right");
                    onClose();
                  }}
                  className="rounded-2xl border border-brand bg-brand/10 px-3 py-5 text-base font-bold transition active:scale-[0.98]"
                >
                  ▶ Start right
                </button>
              </div>
            </div>
          ))}

        {!showTimer && (
          <>
        {/* Time */}
        <Field label={meta.hasDuration ? "Start time" : "Time"}>
          <TextInput
            type="datetime-local"
            value={startLocal}
            onChange={(e) => set({ startAt: fromDatetimeLocal(e.target.value) })}
          />
        </Field>

        {type === "diaper" && (
          <Field label="Type">
            <Segmented
              columns={2}
              value={draft.diaperKind as string}
              onChange={(v) => set({ diaperKind: v })}
              options={[
                { value: "wet", label: "Wet", emoji: "💦" },
                { value: "dirty", label: "Dirty", emoji: "💩" },
                { value: "mixed", label: "Both", emoji: "🌊" },
                { value: "dry", label: "Dry", emoji: "✨" },
              ]}
            />
          </Field>
        )}

        {type === "nursing" && (
          <>
            <Field label="Side">
              <Segmented
                value={draft.side as string}
                onChange={(v) => set({ side: v })}
                options={[
                  { value: "left", label: "Left" },
                  { value: "right", label: "Right" },
                  { value: "both", label: "Both" },
                ]}
              />
            </Field>
            <Field label="Duration" hint="minutes">
              <Stepper
                value={draft.durationMin as number}
                onChange={(v) => set({ durationMin: v })}
                step={1}
                min={0}
                suffix="min"
              />
            </Field>
          </>
        )}

        {type === "bottle" && (
          <>
            <Field label="Amount">
              <Stepper
                value={draft.amount as number}
                onChange={(v) => set({ amount: v })}
                step={settings.volumeUnit === "oz" ? 0.5 : 10}
                min={0}
                suffix={volumeLabel(settings.volumeUnit)}
              />
            </Field>
            <Field label="Contents">
              <Segmented
                columns={2}
                value={draft.contents as string}
                onChange={(v) => set({ contents: v })}
                options={[
                  { value: "breast_milk", label: "Breast milk" },
                  { value: "formula", label: "Formula" },
                  { value: "mixed", label: "Mixed" },
                  { value: "water", label: "Water" },
                ]}
              />
            </Field>
          </>
        )}

        {type === "pump" && (
          <>
            <Field label="Side">
              <Segmented
                value={draft.side as string}
                onChange={(v) => set({ side: v })}
                options={[
                  { value: "left", label: "Left" },
                  { value: "right", label: "Right" },
                  { value: "both", label: "Both" },
                ]}
              />
            </Field>
            <Field label="Amount">
              <Stepper
                value={draft.amount as number}
                onChange={(v) => set({ amount: v })}
                step={settings.volumeUnit === "oz" ? 0.5 : 10}
                min={0}
                suffix={volumeLabel(settings.volumeUnit)}
              />
            </Field>
            <Field label="Duration" hint="minutes (optional)">
              <Stepper
                value={draft.durationMin as number}
                onChange={(v) => set({ durationMin: v })}
                step={1}
                min={0}
                suffix="min"
              />
            </Field>
          </>
        )}

        {type === "sleep" && (
          <>
            <label className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
              <span className="text-sm font-semibold">Still sleeping</span>
              <Toggle
                checked={draft.ongoing as boolean}
                onChange={(v) => set({ ongoing: v })}
              />
            </label>
            {!draft.ongoing && (
              <Field label="End time">
                <TextInput
                  type="datetime-local"
                  value={toDatetimeLocal((draft.endAt as number) ?? draft.startAt)}
                  onChange={(e) => set({ endAt: fromDatetimeLocal(e.target.value) })}
                />
              </Field>
            )}
          </>
        )}

        {type === "solids" && (
          <>
            <Field label="Food">
              <TextInput
                placeholder="e.g. Banana purée"
                value={(draft.food as string) ?? ""}
                onChange={(e) => set({ food: e.target.value })}
              />
            </Field>
            <Field label="Amount" hint="optional">
              <TextInput
                placeholder="e.g. a few spoonfuls"
                value={(draft.amount as string) ?? ""}
                onChange={(e) => set({ amount: e.target.value })}
              />
            </Field>
          </>
        )}

        {type === "growth" && (
          <div className="grid grid-cols-1 gap-4">
            <Field label="Weight" hint={settings.weightUnit}>
              <TextInput
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={(draft.weight as string) ?? ""}
                onChange={(e) => set({ weight: e.target.value })}
              />
            </Field>
            <Field label="Height / length" hint={settings.lengthUnit}>
              <TextInput
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={(draft.height as string) ?? ""}
                onChange={(e) => set({ height: e.target.value })}
              />
            </Field>
            <Field label="Head circumference" hint={`${settings.lengthUnit} (optional)`}>
              <TextInput
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={(draft.head as string) ?? ""}
                onChange={(e) => set({ head: e.target.value })}
              />
            </Field>
          </div>
        )}

        {type === "temperature" && (
          <Field label="Temperature" hint={settings.tempUnit === "f" ? "°F" : "°C"}>
            <Stepper
              value={draft.temp as number}
              onChange={(v) => set({ temp: v })}
              step={0.1}
              suffix={settings.tempUnit === "f" ? "°F" : "°C"}
            />
          </Field>
        )}

        {type === "medication" && (
          <>
            <Field label="Medication">
              <TextInput
                placeholder="e.g. Vitamin D"
                value={(draft.name as string) ?? ""}
                onChange={(e) => set({ name: e.target.value })}
              />
            </Field>
            <Field label="Dose" hint="optional">
              <TextInput
                placeholder="e.g. 400 IU / 2.5 ml"
                value={(draft.dose as string) ?? ""}
                onChange={(e) => set({ dose: e.target.value })}
              />
            </Field>
          </>
        )}

        {/* Notes for every type */}
        <Field label="Notes" hint="optional">
          <TextArea
            placeholder="Anything worth remembering…"
            value={(draft.notes as string) ?? ""}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </Field>

        <PrimaryButton onClick={handleSave}>
          {editing ? "Save changes" : `Log ${meta.label.toLowerCase()}`}
        </PrimaryButton>

        {editing && event && (
          <button
            onClick={() => {
              deleteEvent(event.id);
              onClose();
            }}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-500/10"
          >
            Delete entry
          </button>
        )}
          </>
        )}
      </div>
    </Sheet>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition ${
        checked ? "bg-brand" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

// --- Draft <-> event conversion -------------------------------------------

function initialDraft(
  type: EventType,
  event: BabyEvent | undefined,
  settings: ReturnType<typeof useStore>["settings"]
): Draft {
  const now = Date.now();
  if (event) return eventToDraft(event, settings);
  const base: Draft = { startAt: now, notes: "" };
  switch (type) {
    case "diaper":
      return { ...base, diaperKind: "wet" };
    case "nursing":
      return { ...base, side: "left", durationMin: 15 };
    case "bottle":
      return { ...base, amount: settings.volumeUnit === "oz" ? 3 : 90, contents: "breast_milk" };
    case "pump":
      return { ...base, side: "both", amount: settings.volumeUnit === "oz" ? 3 : 90, durationMin: 15 };
    case "sleep":
      return { ...base, ongoing: true, endAt: now };
    case "solids":
      return { ...base, food: "", amount: "" };
    case "growth":
      return { ...base, weight: "", height: "", head: "" };
    case "temperature":
      return { ...base, temp: settings.tempUnit === "f" ? 98.6 : 37 };
    case "medication":
      return { ...base, name: "", dose: "" };
    case "note":
      return base;
  }
}

function eventToDraft(e: BabyEvent, s: ReturnType<typeof useStore>["settings"]): Draft {
  const base: Draft = { startAt: e.startAt, notes: e.notes ?? "" };
  switch (e.type) {
    case "diaper":
      return { ...base, diaperKind: e.diaperKind };
    case "nursing":
      return { ...base, side: e.side, durationMin: e.durationSec ? Math.round(e.durationSec / 60) : 0 };
    case "bottle":
      return { ...base, amount: round2(mlToDisplay(e.amountMl, s.volumeUnit)), contents: e.contents };
    case "pump":
      return {
        ...base,
        side: e.side,
        amount: round2(mlToDisplay(e.amountMl, s.volumeUnit)),
        durationMin: e.endAt ? Math.round((e.endAt - e.startAt) / 60000) : 0,
      };
    case "sleep":
      return { ...base, ongoing: !e.endAt, endAt: e.endAt ?? e.startAt };
    case "solids":
      return { ...base, food: e.food ?? "", amount: e.amount ?? "" };
    case "growth":
      return {
        ...base,
        weight: e.weightG != null ? String(round2(weightToDisplay(e.weightG, s.weightUnit))) : "",
        height: e.heightCm != null ? String(round2(lengthToDisplay(e.heightCm, s.lengthUnit))) : "",
        head: e.headCm != null ? String(round2(lengthToDisplay(e.headCm, s.lengthUnit))) : "",
      };
    case "temperature":
      return { ...base, temp: round2(cToDisplay(e.tempC, s.tempUnit)) };
    case "medication":
      return { ...base, name: e.name, dose: e.dose ?? "" };
    case "note":
      return base;
  }
}

function buildPayload(
  type: EventType,
  d: Draft,
  s: ReturnType<typeof useStore>["settings"]
): Record<string, unknown> {
  const notes = ((d.notes as string) || "").trim() || undefined;
  const common = { startAt: d.startAt, notes };
  switch (type) {
    case "diaper":
      return { ...common, diaperKind: d.diaperKind };
    case "nursing": {
      const min = Number(d.durationMin) || 0;
      return {
        ...common,
        side: d.side,
        durationSec: min * 60,
        endAt: min > 0 ? d.startAt + min * 60000 : undefined,
      };
    }
    case "bottle":
      return { ...common, amountMl: displayToMl(Number(d.amount) || 0, s.volumeUnit), contents: d.contents };
    case "pump": {
      const min = Number(d.durationMin) || 0;
      return {
        ...common,
        side: d.side,
        amountMl: displayToMl(Number(d.amount) || 0, s.volumeUnit),
        endAt: min > 0 ? d.startAt + min * 60000 : undefined,
      };
    }
    case "sleep":
      return { ...common, endAt: d.ongoing ? undefined : (d.endAt as number) };
    case "solids":
      return {
        ...common,
        food: ((d.food as string) || "").trim() || undefined,
        amount: ((d.amount as string) || "").trim() || undefined,
      };
    case "growth":
      return {
        ...common,
        weightG: numOrUndef(d.weight) != null ? displayToWeightG(Number(d.weight), s.weightUnit) : undefined,
        heightCm: numOrUndef(d.height) != null ? displayToCm(Number(d.height), s.lengthUnit) : undefined,
        headCm: numOrUndef(d.head) != null ? displayToCm(Number(d.head), s.lengthUnit) : undefined,
      };
    case "temperature":
      return { ...common, tempC: displayToC(Number(d.temp) || 0, s.tempUnit) };
    case "medication":
      return {
        ...common,
        name: ((d.name as string) || "").trim() || "Medication",
        dose: ((d.dose as string) || "").trim() || undefined,
      };
    case "note":
      return common;
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function numOrUndef(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
