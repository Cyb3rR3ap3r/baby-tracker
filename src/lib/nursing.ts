// Live nursing-session logic, shared by the server (source of truth) and the
// client (optimistic updates + live ticking). Pure functions, no I/O.

import type { Side } from "./types";

export type NursingSide = "left" | "right";

export interface NursingSession {
  /** When the whole session began (epoch ms). */
  startedAt: number;
  /** Accumulated, already-counted seconds per side. */
  leftSec: number;
  rightSec: number;
  /** The currently selected side. */
  side: NursingSide;
  /** Whether the clock is ticking right now. */
  running: boolean;
  /** Epoch ms when the current running segment started (null when paused). */
  since: number | null;
}

export type NursingAction = "start" | "switch" | "pause" | "resume" | "complete" | "discard";

/** Roll the currently-running segment into the per-side accumulators. */
export function foldRunning(s: NursingSession, now: number): NursingSession {
  if (!s.running || s.since == null) return { ...s };
  const delta = Math.max(0, Math.round((now - s.since) / 1000));
  return {
    ...s,
    leftSec: s.side === "left" ? s.leftSec + delta : s.leftSec,
    rightSec: s.side === "right" ? s.rightSec + delta : s.rightSec,
    since: now,
  };
}

/** Per-side and total seconds including the live running segment. */
export function liveTotals(
  s: NursingSession,
  now: number
): { left: number; right: number; total: number } {
  let left = s.leftSec;
  let right = s.rightSec;
  if (s.running && s.since != null) {
    const delta = Math.max(0, (now - s.since) / 1000);
    if (s.side === "left") left += delta;
    else right += delta;
  }
  return { left, right, total: left + right };
}

/**
 * Apply a control action, returning the next session (or null when cleared).
 * `complete` is handled by the caller (it also creates a history entry); here
 * it simply resolves to null.
 */
export function applyAction(
  session: NursingSession | null,
  action: NursingAction,
  side: NursingSide | undefined,
  now: number
): NursingSession | null {
  switch (action) {
    case "start":
      return {
        startedAt: now,
        leftSec: 0,
        rightSec: 0,
        side: side ?? "left",
        running: true,
        since: now,
      };
    case "switch": {
      if (!session)
        return applyAction(null, "start", side, now);
      const folded = foldRunning(session, now);
      return { ...folded, side: side ?? folded.side, running: true, since: now };
    }
    case "pause": {
      if (!session) return null;
      const folded = foldRunning(session, now);
      return { ...folded, running: false, since: null };
    }
    case "resume": {
      if (!session) return null;
      return { ...session, side: side ?? session.side, running: true, since: now };
    }
    case "complete":
    case "discard":
      return null;
  }
}

/** Derive the nursing history entry fields from a session being completed. */
export function sessionToEntry(
  session: NursingSession,
  now: number
): {
  side: Side;
  durationSec: number;
  leftSec: number;
  rightSec: number;
  startAt: number;
  endAt: number;
} {
  const folded = foldRunning(session, now);
  const leftSec = Math.round(folded.leftSec);
  const rightSec = Math.round(folded.rightSec);
  const side: Side = leftSec > 0 && rightSec > 0 ? "both" : rightSec > 0 ? "right" : "left";
  return {
    side,
    durationSec: leftSec + rightSec,
    leftSec,
    rightSec,
    startAt: session.startedAt,
    endAt: now,
  };
}
