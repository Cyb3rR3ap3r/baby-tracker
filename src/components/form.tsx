"use client";

import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 placeholder:text-muted";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={2}
      {...props}
      className={`${inputBase} resize-none ${props.className ?? ""}`}
    />
  );
}

export interface Option<T extends string> {
  value: T;
  label: string;
  emoji?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  columns,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0,1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
              active
                ? "border-brand bg-brand text-white shadow-sm"
                : "border-border bg-background text-foreground hover:border-brand/50"
            }`}
          >
            {o.emoji && <span aria-hidden>{o.emoji}</span>}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const clamp = (n: number) => {
    let x = n;
    if (min != null) x = Math.max(min, x);
    if (max != null) x = Math.min(max, x);
    return Math.round(x * 100) / 100;
  };
  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-background text-xl font-bold text-foreground transition hover:border-brand/50 active:scale-95"
        aria-label="Decrease"
      >
        −
      </button>
      <div className="relative flex-1">
        <input
          type="number"
          inputMode="decimal"
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => onChange(clamp(parseFloat(e.target.value)))}
          className={`${inputBase} text-center font-semibold`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
            {suffix}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-background text-xl font-bold text-foreground transition hover:border-brand/50 active:scale-95"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full rounded-xl bg-brand px-4 py-3.5 text-base font-bold text-white shadow-sm transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50 ${
        props.className ?? ""
      }`}
    >
      {children}
    </button>
  );
}
