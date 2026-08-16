"use client";

import { LogProvider } from "./LogProvider";
import { BottomNav, SideNav } from "./Nav";
import { ActiveNursingBar } from "./ActiveNursingBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LogProvider>
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
        <SideNav />
        <main className="min-w-0 flex-1 pb-28 md:pb-8">
          <ActiveNursingBar />
          <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6">{children}</div>
        </main>
      </div>
      <BottomNav />
    </LogProvider>
  );
}
