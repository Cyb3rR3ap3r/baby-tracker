"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { LogSheet } from "./LogSheet";
import { Sheet } from "./Sheet";
import { EVENT_META, EVENT_ORDER } from "@/lib/eventMeta";
import { colorClasses } from "@/lib/colors";
import type { BabyEvent, EventType } from "@/lib/types";

interface LogContextValue {
  /** Open the form for a specific event type (new entry). */
  log: (type: EventType) => void;
  /** Open the "what do you want to log?" picker. */
  openPicker: () => void;
  /** Edit an existing entry. */
  edit: (event: BabyEvent) => void;
}

const LogContext = createContext<LogContextValue | null>(null);

export function LogProvider({ children }: { children: React.ReactNode }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [active, setActive] = useState<{ type: EventType; event?: BabyEvent } | null>(null);

  const log = useCallback((type: EventType) => {
    setPickerOpen(false);
    setActive({ type });
  }, []);
  const edit = useCallback((event: BabyEvent) => setActive({ type: event.type, event }), []);
  const openPicker = useCallback(() => setPickerOpen(true), []);

  return (
    <LogContext.Provider value={{ log, openPicker, edit }}>
      {children}

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="What happened?">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {EVENT_ORDER.map((type) => {
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
      </Sheet>

      {active && (
        <LogSheet type={active.type} event={active.event} onClose={() => setActive(null)} />
      )}
    </LogContext.Provider>
  );
}

export function useLog(): LogContextValue {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error("useLog must be used within LogProvider");
  return ctx;
}
