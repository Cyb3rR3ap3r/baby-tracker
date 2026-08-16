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
import { applyAction, type NursingAction, type NursingSession, type NursingSide } from "./nursing";

type StateResponse = AppData & { activeNursing: NursingSession | null };

const DATA_VERSION = 1;
const POLL_MS = 15000; // refetch cadence so other devices' changes show up
const THEME_HINT_KEY = "bt-theme"; // local mirror used only to avoid theme flash

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

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${url} → ${res.status}`);
  return (await res.json()) as T;
}

interface StoreContextValue {
  ready: boolean;
  online: boolean;
  data: AppData;
  events: BabyEvent[];
  settings: Settings;
  baby: Baby;
  addEvent: (e: Omit<BabyEvent, "id" | "createdAt" | "updatedAt">) => BabyEvent;
  updateEvent: (id: string, patch: Partial<BabyEvent>) => void;
  deleteEvent: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateBaby: (patch: Partial<Baby>) => void;
  replaceAll: (data: AppData) => Promise<void>;
  clearEvents: () => void;
  refresh: () => void;
  activeNursing: NursingSession | null;
  nursing: (action: NursingAction, side?: NursingSide) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [activeNursing, setActiveNursing] = useState<NursingSession | null>(null);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  // Number of in-flight writes; while > 0 we skip background polls so a poll
  // can't clobber an optimistic update that hasn't been persisted yet.
  const pending = useRef(0);

  const applyState = useCallback((resp: StateResponse) => {
    const { activeNursing: an, ...appData } = resp;
    setData(appData);
    setActiveNursing(an ?? null);
  }, []);

  const refresh = useCallback(async () => {
    if (pending.current > 0) return;
    try {
      applyState(await api<StateResponse>("/api/state"));
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, [applyState]);

  // Initial load.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const next = await api<StateResponse>("/api/state");
        if (alive) {
          applyState(next);
          setOnline(true);
        }
      } catch {
        if (alive) setOnline(false);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [applyState]);

  // Keep a local theme hint so the pre-paint script avoids a flash.
  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_HINT_KEY, data.settings.theme);
    } catch {
      /* ignore */
    }
  }, [data.settings.theme]);

  // Poll + refetch when the tab regains focus, so devices stay in sync.
  useEffect(() => {
    const id = setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  // Run a write with optimistic local state, reconciling from the server after.
  const mutate = useCallback(
    async (optimistic: (d: AppData) => AppData, request: () => Promise<unknown>) => {
      setData((d) => optimistic(d));
      pending.current += 1;
      try {
        await request();
        setOnline(true);
      } catch {
        setOnline(false);
      } finally {
        pending.current -= 1;
        if (pending.current === 0) refresh();
      }
    },
    [refresh]
  );

  const addEvent: StoreContextValue["addEvent"] = useCallback(
    (e) => {
      const now = Date.now();
      const full = { ...e, id: genId(), createdAt: now, updatedAt: now } as BabyEvent;
      void mutate(
        (d) => ({ ...d, events: [full, ...d.events] }),
        () => api("/api/events", { method: "POST", body: JSON.stringify(full) })
      );
      return full;
    },
    [mutate]
  );

  const updateEvent = useCallback(
    (id: string, patch: Partial<BabyEvent>) => {
      void mutate(
        (d) => ({
          ...d,
          events: d.events.map((e) =>
            e.id === id ? ({ ...e, ...patch, updatedAt: Date.now() } as BabyEvent) : e
          ),
        }),
        () => api(`/api/events/${id}`, { method: "PATCH", body: JSON.stringify(patch) })
      );
    },
    [mutate]
  );

  const deleteEvent = useCallback(
    (id: string) => {
      void mutate(
        (d) => ({ ...d, events: d.events.filter((e) => e.id !== id) }),
        () => api(`/api/events/${id}`, { method: "DELETE" })
      );
    },
    [mutate]
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      void mutate(
        (d) => ({ ...d, settings: { ...d.settings, ...patch } }),
        () => api("/api/settings", { method: "PUT", body: JSON.stringify(patch) })
      );
    },
    [mutate]
  );

  const updateBaby = useCallback(
    (patch: Partial<Baby>) => {
      void mutate(
        (d) => ({ ...d, baby: { ...d.baby, ...patch } }),
        () => api("/api/baby", { method: "PUT", body: JSON.stringify(patch) })
      );
    },
    [mutate]
  );

  const clearEvents = useCallback(() => {
    void mutate(
      (d) => ({ ...d, events: [] }),
      () => api("/api/data", { method: "DELETE" })
    );
  }, [mutate]);

  const nursing = useCallback(
    (action: NursingAction, side?: NursingSide) => {
      const now = Date.now();
      if (action === "complete" || action === "discard") {
        // Clear locally right away; refresh pulls the new history entry.
        setActiveNursing(null);
        pending.current += 1;
        api("/api/nursing", { method: "POST", body: JSON.stringify({ action }) })
          .then(() => setOnline(true))
          .catch(() => setOnline(false))
          .finally(() => {
            pending.current -= 1;
            if (pending.current === 0) refresh();
          });
        return;
      }
      // start / switch / pause / resume — optimistic, then take the server's
      // authoritative session from the response.
      setActiveNursing((prev) => applyAction(prev, action, side, now));
      pending.current += 1;
      api<{ session: NursingSession | null }>("/api/nursing", {
        method: "POST",
        body: JSON.stringify({ action, side }),
      })
        .then((res) => {
          setActiveNursing(res.session);
          setOnline(true);
        })
        .catch(() => setOnline(false))
        .finally(() => {
          pending.current -= 1;
        });
    },
    [refresh]
  );

  const replaceAll = useCallback(async (next: AppData) => {
    pending.current += 1;
    try {
      const saved = await api<AppData>("/api/data", {
        method: "POST",
        body: JSON.stringify(next),
      });
      setData(saved);
      setOnline(true);
    } catch {
      setOnline(false);
      throw new Error("import failed");
    } finally {
      pending.current -= 1;
    }
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      ready,
      online,
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
      refresh,
      activeNursing,
      nursing,
    }),
    [
      ready,
      online,
      data,
      addEvent,
      updateEvent,
      deleteEvent,
      updateSettings,
      updateBaby,
      replaceAll,
      clearEvents,
      refresh,
      activeNursing,
      nursing,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
