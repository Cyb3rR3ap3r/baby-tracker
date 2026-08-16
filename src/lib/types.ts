// Core domain types for the baby tracker.
// All measurements are stored in canonical units (ml, grams, cm, Celsius)
// and converted for display based on user settings.

export type EventType =
  | "diaper"
  | "nursing"
  | "bottle"
  | "pump"
  | "sleep"
  | "solids"
  | "growth"
  | "temperature"
  | "medication"
  | "note";

export interface BaseEvent {
  id: string;
  type: EventType;
  /** Epoch milliseconds when the event started / occurred. */
  startAt: number;
  /** Epoch milliseconds when the event ended (for sleep, nursing, etc.). */
  endAt?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type DiaperKind = "wet" | "dirty" | "mixed" | "dry";
export type Side = "left" | "right" | "both";
export type BottleContents = "formula" | "breast_milk" | "mixed" | "water";

export interface DiaperEvent extends BaseEvent {
  type: "diaper";
  diaperKind: DiaperKind;
}

export interface NursingEvent extends BaseEvent {
  type: "nursing";
  side: Side;
  /** Duration in seconds. Derived from start/end when both present. */
  durationSec?: number;
  /** Per-side seconds, when logged via the live timer. */
  leftSec?: number;
  rightSec?: number;
}

export interface BottleEvent extends BaseEvent {
  type: "bottle";
  /** Volume in millilitres (canonical). */
  amountMl: number;
  contents: BottleContents;
}

export interface PumpEvent extends BaseEvent {
  type: "pump";
  side: Side;
  /** Volume in millilitres (canonical). */
  amountMl: number;
}

export interface SleepEvent extends BaseEvent {
  type: "sleep";
}

export interface SolidsEvent extends BaseEvent {
  type: "solids";
  food?: string;
  /** Free-form amount, e.g. "a few spoonfuls". */
  amount?: string;
}

export interface GrowthEvent extends BaseEvent {
  type: "growth";
  /** Weight in grams. */
  weightG?: number;
  /** Height/length in centimetres. */
  heightCm?: number;
  /** Head circumference in centimetres. */
  headCm?: number;
}

export interface TemperatureEvent extends BaseEvent {
  type: "temperature";
  /** Temperature in Celsius (canonical). */
  tempC: number;
}

export interface MedicationEvent extends BaseEvent {
  type: "medication";
  name: string;
  dose?: string;
}

export interface NoteEvent extends BaseEvent {
  type: "note";
}

export type BabyEvent =
  | DiaperEvent
  | NursingEvent
  | BottleEvent
  | PumpEvent
  | SleepEvent
  | SolidsEvent
  | GrowthEvent
  | TemperatureEvent
  | MedicationEvent
  | NoteEvent;

export type VolumeUnit = "ml" | "oz";
export type WeightUnit = "kg" | "lb";
export type LengthUnit = "cm" | "in";
export type TempUnit = "c" | "f";
export type ThemePref = "system" | "light" | "dark";

export interface Settings {
  volumeUnit: VolumeUnit;
  weightUnit: WeightUnit;
  lengthUnit: LengthUnit;
  tempUnit: TempUnit;
  theme: ThemePref;
}

export interface Baby {
  name: string;
  /** ISO date string (yyyy-mm-dd). */
  birthDate?: string;
}

export interface AppData {
  version: number;
  baby: Baby;
  settings: Settings;
  events: BabyEvent[];
}
