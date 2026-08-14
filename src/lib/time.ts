// Time & duration formatting helpers.

export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** e.g. "2h 15m", "45m", "30s" */
export function formatDuration(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

/** Stopwatch style, e.g. "6:05" or "1:02:09". */
export function clockDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** Relative "time since" label, e.g. "just now", "12m ago", "3h ago", "2d ago". */
export function timeAgo(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ${min % 60}m ago`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h ago`;
}

/** Compact "time since" without the "ago" suffix, e.g. "3h 12m". */
export function elapsed(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts);
  return formatDuration(Math.floor(diff / 1000));
}

/** Key for grouping events by calendar day (local). */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function dayLabel(ts: number, now = Date.now()): string {
  const k = dayKey(ts);
  if (k === dayKey(now)) return "Today";
  if (k === dayKey(now - 86400000)) return "Yesterday";
  return new Date(ts).toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Convert an epoch ms to a value for <input type="datetime-local">. */
export function toDatetimeLocal(ts: number): string {
  const d = new Date(ts);
  const off = d.getTimezoneOffset();
  const local = new Date(ts - off * 60000);
  return local.toISOString().slice(0, 16);
}

export function fromDatetimeLocal(value: string): number {
  return new Date(value).getTime();
}

/** Age of the baby from an ISO birth date, e.g. "3 mo 12 d" or "5 days". */
export function babyAge(birthISO: string | undefined, now = Date.now()): string | null {
  if (!birthISO) return null;
  const birth = new Date(birthISO + "T00:00:00");
  if (isNaN(birth.getTime())) return null;
  let months =
    (new Date(now).getFullYear() - birth.getFullYear()) * 12 +
    (new Date(now).getMonth() - birth.getMonth());
  const dayInMonth = new Date(now).getDate() - birth.getDate();
  if (dayInMonth < 0) months -= 1;
  const totalDays = Math.floor((now - birth.getTime()) / 86400000);
  if (totalDays < 0) return "not born yet";
  if (totalDays < 14) return `${totalDays} day${totalDays === 1 ? "" : "s"} old`;
  if (months < 1) return `${Math.floor(totalDays / 7)} weeks old`;
  if (months < 24) {
    const ref = new Date(birth);
    ref.setMonth(ref.getMonth() + months);
    const days = Math.floor((now - ref.getTime()) / 86400000);
    return days > 0 ? `${months} mo ${days} d old` : `${months} mo old`;
  }
  const years = Math.floor(months / 12);
  return `${years} yr ${months % 12} mo old`;
}
