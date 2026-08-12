"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AppData, BabyEvent, Baby, Settings } from "./types";

const STORAGE_KEY = "baby-tracker:data:v1";
const DATA_VERSION = 1;

const DEFAULT_SETTINGS: Settings = {
  volumeUnit: "ml",
  weightUnit: "kg",
  lengthUnit: "cm",
  tempUnit: "c",
  theme: "system",
};

const DEFAULT_DATA: AppData = {
  version: DATA_VERSION,
  baby: { name: "" },
  settings: DEFAULT_SETTINGS,
  events: [],
};

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function load(): AppData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      version: DATA_VERSION,
      baby: { ...DEFAULT_DATA.baby, ...parsed.baby },
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return DEFAULT_DATA;
  }
}

interface StoreContextValue {
  ready: boolean;
  data: AppData;
  events: BabyEvent[];
  settings: Settings;
  baby: Baby;
  addEvent: (e: Omit<BabyEvent, "id" | "createdAt" | "updatedAt">) => BabyEvent;
  updateEvent: (id: string, patch: Partial<BabyEvent>) => void;
  deleteEvent: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateBaby: (patch: Partial<Baby>) => void;
  replaceAll: (data: AppData) => void;
  clearEvents: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [ready, setReady] = useState(false);
  const first = useRef(true);

  // Hydrate from localStorage after mount. This intentionally sets state in an
  // effect: the server has no access to localStorage, so we render defaults first
  // and swap in persisted data on the client to avoid an SSR hydration mismatch.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setData(load());
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Persist on change (skip the very first render before hydration).
  useEffect(() => {
    if (!ready) return;
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore quota errors */
    }
  }, [data, ready]);

  // Sync across tabs.
  useEffect(() => {
    function onStorage(ev: StorageEvent) {
      if (ev.key === STORAGE_KEY) setData(load());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addEvent: StoreContextValue["addEvent"] = useCallback((e) => {
    const now = Date.now();
    const full = { ...e, id: genId(), createdAt: now, updatedAt: now } as BabyEvent;
    setData((d) => ({ ...d, events: [full, ...d.events] }));
    return full;
  }, []);

  const updateEvent = useCallback((id: string, patch: Partial<BabyEvent>) => {
    setData((d) => ({
      ...d,
      events: d.events.map((e) =>
        e.id === id ? ({ ...e, ...patch, updatedAt: Date.now() } as BabyEvent) : e
      ),
    }));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setData((d) => ({ ...d, events: d.events.filter((e) => e.id !== id) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const updateBaby = useCallback((patch: Partial<Baby>) => {
    setData((d) => ({ ...d, baby: { ...d.baby, ...patch } }));
  }, []);

  const replaceAll = useCallback((next: AppData) => {
    setData({
      version: DATA_VERSION,
      baby: { ...DEFAULT_DATA.baby, ...next.baby },
      settings: { ...DEFAULT_SETTINGS, ...next.settings },
      events: Array.isArray(next.events) ? next.events : [],
    });
  }, []);

  const clearEvents = useCallback(() => {
    setData((d) => ({ ...d, events: [] }));
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      ready,
      data,
      events: data.events,
      settings: data.settings,
      baby: data.baby,
      addEvent,
      updateEvent,
      deleteEvent,
      updateSettings,
      updateBaby,
      replaceAll,
      clearEvents,
    }),
    [ready, data, addEvent, updateEvent, deleteEvent, updateSettings, updateBaby, replaceAll, clearEvents]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
