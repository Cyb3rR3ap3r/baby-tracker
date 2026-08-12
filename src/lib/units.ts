import type { Settings } from "./types";

// --- Volume (canonical: millilitres) ---
export const ML_PER_OZ = 29.5735;

export function mlToDisplay(ml: number, unit: Settings["volumeUnit"]): number {
  return unit === "oz" ? ml / ML_PER_OZ : ml;
}
export function displayToMl(value: number, unit: Settings["volumeUnit"]): number {
  return unit === "oz" ? value * ML_PER_OZ : value;
}
export function formatVolume(ml: number, unit: Settings["volumeUnit"]): string {
  const v = mlToDisplay(ml, unit);
  return unit === "oz" ? `${round(v, 1)} oz` : `${Math.round(v)} ml`;
}
export function volumeLabel(unit: Settings["volumeUnit"]): string {
  return unit === "oz" ? "oz" : "ml";
}

// --- Weight (canonical: grams) ---
export const G_PER_LB = 453.592;
export function formatWeight(g: number, unit: Settings["weightUnit"]): string {
  return unit === "lb" ? `${round(g / G_PER_LB, 2)} lb` : `${round(g / 1000, 2)} kg`;
}
export function weightToDisplay(g: number, unit: Settings["weightUnit"]): number {
  return unit === "lb" ? g / G_PER_LB : g / 1000;
}
export function displayToWeightG(value: number, unit: Settings["weightUnit"]): number {
  return unit === "lb" ? value * G_PER_LB : value * 1000;
}
export function lengthToDisplay(cm: number, unit: Settings["lengthUnit"]): number {
  return unit === "in" ? cm / CM_PER_IN : cm;
}
export function displayToCm(value: number, unit: Settings["lengthUnit"]): number {
  return unit === "in" ? value * CM_PER_IN : value;
}

// --- Length (canonical: centimetres) ---
export const CM_PER_IN = 2.54;
export function formatLength(cm: number, unit: Settings["lengthUnit"]): string {
  return unit === "in" ? `${round(cm / CM_PER_IN, 1)} in` : `${round(cm, 1)} cm`;
}

// --- Temperature (canonical: Celsius) ---
export function formatTemp(c: number, unit: Settings["tempUnit"]): string {
  return unit === "f" ? `${round((c * 9) / 5 + 32, 1)}°F` : `${round(c, 1)}°C`;
}
export function cToDisplay(c: number, unit: Settings["tempUnit"]): number {
  return unit === "f" ? (c * 9) / 5 + 32 : c;
}
export function displayToC(value: number, unit: Settings["tempUnit"]): number {
  return unit === "f" ? ((value - 32) * 5) / 9 : value;
}

export function round(n: number, decimals = 0): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}
