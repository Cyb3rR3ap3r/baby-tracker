"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

/** Applies the user's theme preference to <html> as a `.dark` class. */
export function ThemeManager() {
  const { settings, ready } = useStore();

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const dark =
        settings.theme === "dark" || (settings.theme === "system" && mq.matches);
      root.classList.toggle("dark", dark);
    };

    apply();
    if (settings.theme === "system") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [settings.theme, ready]);

  return null;
}
