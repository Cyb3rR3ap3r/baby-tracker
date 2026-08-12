// Explicit literal Tailwind class strings per accent color so the JIT
// compiler can see them (dynamic `bg-${color}-100` would not be detected).

export interface ColorClasses {
  /** Soft tinted chip / icon background with matching text. */
  soft: string;
  /** Solid filled button (used for quick-add tiles). */
  tile: string;
  /** Left accent bar / dot color. */
  dot: string;
  /** Bar fill for charts. */
  bar: string;
}

export const COLORS: Record<string, ColorClasses> = {
  amber: {
    soft: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
    tile: "bg-amber-50 hover:bg-amber-100 border-amber-200 dark:bg-amber-400/10 dark:border-amber-400/20 dark:hover:bg-amber-400/20",
    dot: "bg-amber-400",
    bar: "bg-amber-400",
  },
  rose: {
    soft: "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
    tile: "bg-rose-50 hover:bg-rose-100 border-rose-200 dark:bg-rose-400/10 dark:border-rose-400/20 dark:hover:bg-rose-400/20",
    dot: "bg-rose-400",
    bar: "bg-rose-400",
  },
  sky: {
    soft: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
    tile: "bg-sky-50 hover:bg-sky-100 border-sky-200 dark:bg-sky-400/10 dark:border-sky-400/20 dark:hover:bg-sky-400/20",
    dot: "bg-sky-400",
    bar: "bg-sky-400",
  },
  teal: {
    soft: "bg-teal-100 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300",
    tile: "bg-teal-50 hover:bg-teal-100 border-teal-200 dark:bg-teal-400/10 dark:border-teal-400/20 dark:hover:bg-teal-400/20",
    dot: "bg-teal-400",
    bar: "bg-teal-400",
  },
  indigo: {
    soft: "bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300",
    tile: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 dark:bg-indigo-400/10 dark:border-indigo-400/20 dark:hover:bg-indigo-400/20",
    dot: "bg-indigo-400",
    bar: "bg-indigo-400",
  },
  green: {
    soft: "bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-300",
    tile: "bg-green-50 hover:bg-green-100 border-green-200 dark:bg-green-400/10 dark:border-green-400/20 dark:hover:bg-green-400/20",
    dot: "bg-green-400",
    bar: "bg-green-400",
  },
  cyan: {
    soft: "bg-cyan-100 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300",
    tile: "bg-cyan-50 hover:bg-cyan-100 border-cyan-200 dark:bg-cyan-400/10 dark:border-cyan-400/20 dark:hover:bg-cyan-400/20",
    dot: "bg-cyan-400",
    bar: "bg-cyan-400",
  },
  orange: {
    soft: "bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300",
    tile: "bg-orange-50 hover:bg-orange-100 border-orange-200 dark:bg-orange-400/10 dark:border-orange-400/20 dark:hover:bg-orange-400/20",
    dot: "bg-orange-400",
    bar: "bg-orange-400",
  },
  red: {
    soft: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
    tile: "bg-red-50 hover:bg-red-100 border-red-200 dark:bg-red-400/10 dark:border-red-400/20 dark:hover:bg-red-400/20",
    dot: "bg-red-400",
    bar: "bg-red-400",
  },
  slate: {
    soft: "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300",
    tile: "bg-slate-50 hover:bg-slate-100 border-slate-200 dark:bg-slate-400/10 dark:border-slate-400/20 dark:hover:bg-slate-400/20",
    dot: "bg-slate-400",
    bar: "bg-slate-400",
  },
};

export function colorClasses(color: string): ColorClasses {
  return COLORS[color] ?? COLORS.slate;
}
