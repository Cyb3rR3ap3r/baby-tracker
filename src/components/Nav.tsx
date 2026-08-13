"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLog } from "./LogProvider";

interface Item {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function Icon({ path }: { path: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

const ITEMS: Item[] = [
  { href: "/", label: "Home", icon: <Icon path="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" /> },
  { href: "/history", label: "History", icon: <Icon path="M4 6h16M4 12h16M4 18h10" /> },
  { href: "/stats", label: "Stats", icon: <Icon path="M4 20V10M10 20V4M16 20v-7M22 20H2" /> },
  { href: "/settings", label: "Settings", icon: <Icon path="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.87 1.2V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 2.6 15H2.5a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.2 7l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6h.09A1.7 1.7 0 0 0 11 3v0a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 17 4.6l.06-.06a2 2 0 1 1 2.83 2.83L19.4 7Z" /> },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  const { openPicker } = useLog();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-safe pt-1.5">
        {ITEMS.slice(0, 2).map((it) => (
          <NavLink key={it.href} item={it} active={isActive(pathname, it.href)} />
        ))}
        <button
          onClick={openPicker}
          aria-label="Log an entry"
          className="-mt-6 grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 ring-4 ring-background transition active:scale-95"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        {ITEMS.slice(2).map((it) => (
          <NavLink key={it.href} item={it} active={isActive(pathname, it.href)} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({ item, active }: { item: Item; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex w-16 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition ${
        active ? "text-brand" : "text-muted"
      }`}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  );
}

export function SideNav() {
  const pathname = usePathname();
  const { openPicker } = useLog();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="text-2xl">🍼</span>
        <span className="text-xl font-extrabold tracking-tight">Little Log</span>
      </div>
      <button
        onClick={openPicker}
        className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-bold text-white shadow-sm transition hover:brightness-105"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Log entry
      </button>
      <nav className="flex flex-col gap-1">
        {ITEMS.map((it) => {
          const active = isActive(pathname, it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition ${
                active
                  ? "bg-brand/10 text-brand"
                  : "text-muted hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {it.icon}
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-3 text-xs text-muted">Little Log · self-hosted</div>
    </aside>
  );
}
