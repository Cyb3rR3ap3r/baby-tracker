import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { AppData, BabyEvent, Baby, Settings } from "./types";

// --- Defaults (mirrored on the client for first-run state) ---
export const DEFAULT_SETTINGS: Settings = {
  volumeUnit: "ml",
  weightUnit: "kg",
  lengthUnit: "cm",
  tempUnit: "c",
  theme: "system",
};
export const DEFAULT_BABY: Baby = { name: "" };
const DATA_VERSION = 1;

// --- Lazy singleton connection ---------------------------------------------
// Opened on first use (not at import time) so `next build` never touches disk.
let _db: Database.Database | null = null;

function dbPath(): string {
  const fromEnv = process.env.DB_PATH;
  if (fromEnv) return fromEnv;
  return path.join(process.cwd(), "data", "baby-tracker.db");
}

function getDb(): Database.Database {
  if (_db) return _db;
  const file = dbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id        TEXT PRIMARY KEY,
      type      TEXT NOT NULL,
      startAt   INTEGER NOT NULL,
      endAt     INTEGER,
      data      TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_events_startAt ON events(startAt DESC);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);

    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  _db = db;
  return db;
}

// --- Meta (settings + baby) helpers ----------------------------------------
function readMeta<T>(key: string, fallback: T): T {
  const row = getDb().prepare("SELECT value FROM meta WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  if (!row) return fallback;
  try {
    return { ...fallback, ...(JSON.parse(row.value) as object) } as T;
  } catch {
    return fallback;
  }
}

function writeMeta(key: string, value: unknown): void {
  getDb()
    .prepare(
      "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run(key, JSON.stringify(value));
}

export function getSettings(): Settings {
  return readMeta<Settings>("settings", DEFAULT_SETTINGS);
}
export function saveSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch };
  writeMeta("settings", next);
  return next;
}
export function getBaby(): Baby {
  return readMeta<Baby>("baby", DEFAULT_BABY);
}
export function saveBaby(patch: Partial<Baby>): Baby {
  const next = { ...getBaby(), ...patch };
  writeMeta("baby", next);
  return next;
}

// --- Events ----------------------------------------------------------------
function rowToEvent(row: { data: string }): BabyEvent {
  return JSON.parse(row.data) as BabyEvent;
}

export function listEvents(): BabyEvent[] {
  const rows = getDb()
    .prepare("SELECT data FROM events ORDER BY startAt DESC, createdAt DESC")
    .all() as { data: string }[];
  return rows.map(rowToEvent);
}

const upsertStmt = () =>
  getDb().prepare(
    `INSERT INTO events (id, type, startAt, endAt, data, createdAt, updatedAt)
     VALUES (@id, @type, @startAt, @endAt, @data, @createdAt, @updatedAt)
     ON CONFLICT(id) DO UPDATE SET
       type=excluded.type, startAt=excluded.startAt, endAt=excluded.endAt,
       data=excluded.data, updatedAt=excluded.updatedAt`
  );

export function upsertEvent(e: BabyEvent): BabyEvent {
  upsertStmt().run({
    id: e.id,
    type: e.type,
    startAt: e.startAt,
    endAt: e.endAt ?? null,
    data: JSON.stringify(e),
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  });
  return e;
}

export function getEvent(id: string): BabyEvent | undefined {
  const row = getDb().prepare("SELECT data FROM events WHERE id = ?").get(id) as
    | { data: string }
    | undefined;
  return row ? rowToEvent(row) : undefined;
}

export function patchEvent(id: string, patch: Partial<BabyEvent>): BabyEvent | undefined {
  const existing = getEvent(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...patch, id, updatedAt: Date.now() } as BabyEvent;
  return upsertEvent(merged);
}

export function deleteEvent(id: string): void {
  getDb().prepare("DELETE FROM events WHERE id = ?").run(id);
}

export function clearEvents(): void {
  getDb().prepare("DELETE FROM events").run();
}

// --- Whole-state read + bulk replace (export / import) ---------------------
export function getState(): AppData {
  return {
    version: DATA_VERSION,
    baby: getBaby(),
    settings: getSettings(),
    events: listEvents(),
  };
}

export function replaceAll(data: AppData): AppData {
  const db = getDb();
  const tx = db.transaction((d: AppData) => {
    db.prepare("DELETE FROM events").run();
    const stmt = upsertStmt();
    for (const e of d.events ?? []) {
      if (!e || !e.id) continue;
      stmt.run({
        id: e.id,
        type: e.type,
        startAt: e.startAt,
        endAt: e.endAt ?? null,
        data: JSON.stringify(e),
        createdAt: e.createdAt ?? Date.now(),
        updatedAt: e.updatedAt ?? Date.now(),
      });
    }
    writeMeta("settings", { ...DEFAULT_SETTINGS, ...d.settings });
    writeMeta("baby", { ...DEFAULT_BABY, ...d.baby });
  });
  tx(data);
  return getState();
}
