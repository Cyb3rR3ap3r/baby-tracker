"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Field, Segmented, TextInput } from "@/components/form";
import type { AppData } from "@/lib/types";

export default function SettingsPage() {
  const { ready, baby, settings, events, updateBaby, updateSettings, replaceAll, clearEvents, data } =
    useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(null), 2500);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `little-log-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Backup downloaded");
  }

  function importData(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppData;
        if (!parsed || !Array.isArray(parsed.events)) throw new Error("bad file");
        const ok = confirm(
          `Restore ${parsed.events.length} entries from this backup? This replaces all current data on the server.`
        );
        if (!ok) return;
        await replaceAll(parsed);
        flash(`Restored ${parsed.events.length} entries`);
      } catch {
        flash("Could not read that file");
      }
    };
    reader.readAsText(file);
  }

  if (!ready) return <div className="h-96 animate-pulse rounded-2xl bg-surface" />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
      </header>

      {/* Baby profile */}
      <Card title="Baby profile">
        <Field label="Name">
          <TextInput
            placeholder="Baby's name"
            value={baby.name}
            onChange={(e) => updateBaby({ name: e.target.value })}
          />
        </Field>
        <Field label="Birth date" hint="used to show age">
          <TextInput
            type="date"
            value={baby.birthDate ?? ""}
            onChange={(e) => updateBaby({ birthDate: e.target.value })}
          />
        </Field>
      </Card>

      {/* Units */}
      <Card title="Units">
        <Field label="Volume">
          <Segmented
            value={settings.volumeUnit}
            onChange={(v) => updateSettings({ volumeUnit: v as "ml" | "oz" })}
            options={[
              { value: "ml", label: "Millilitres (ml)" },
              { value: "oz", label: "Ounces (oz)" },
            ]}
          />
        </Field>
        <Field label="Weight">
          <Segmented
            value={settings.weightUnit}
            onChange={(v) => updateSettings({ weightUnit: v as "kg" | "lb" })}
            options={[
              { value: "kg", label: "Kilograms" },
              { value: "lb", label: "Pounds" },
            ]}
          />
        </Field>
        <Field label="Length">
          <Segmented
            value={settings.lengthUnit}
            onChange={(v) => updateSettings({ lengthUnit: v as "cm" | "in" })}
            options={[
              { value: "cm", label: "Centimetres" },
              { value: "in", label: "Inches" },
            ]}
          />
        </Field>
        <Field label="Temperature">
          <Segmented
            value={settings.tempUnit}
            onChange={(v) => updateSettings({ tempUnit: v as "c" | "f" })}
            options={[
              { value: "c", label: "Celsius" },
              { value: "f", label: "Fahrenheit" },
            ]}
          />
        </Field>
      </Card>

      {/* Appearance */}
      <Card title="Appearance">
        <Field label="Theme">
          <Segmented
            value={settings.theme}
            onChange={(v) => updateSettings({ theme: v as "system" | "light" | "dark" })}
            options={[
              { value: "system", label: "Auto" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </Field>
      </Card>

      {/* Data */}
      <Card title="Backup & restore">
        <p className="text-sm text-muted">
          {events.length} entries saved on your server and shared across every device. A backup is a
          single JSON file with your <strong>full history</strong> plus baby profile and settings —
          keep a copy somewhere safe, or use it to move to another server.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={exportData}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold transition hover:border-brand/50"
          >
            ⬇︎ Download backup
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold transition hover:border-brand/50"
          >
            ⬆︎ Restore backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importData(f);
              e.target.value = "";
            }}
          />
        </div>
        <button
          onClick={() => {
            if (confirm("Delete ALL entries? This cannot be undone.")) {
              clearEvents();
              flash("All entries cleared");
            }
          }}
          className="w-full rounded-xl px-4 py-3 text-sm font-bold text-red-500 transition hover:bg-red-500/10"
        >
          Clear all entries
        </button>
      </Card>

      {msg && (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-lg md:bottom-8">
          {msg}
        </div>
      )}

      <p className="px-1 text-center text-xs text-muted">
        Little Log stores data on your own server — shared across your devices, private to your
        network.
      </p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl bg-surface p-5 ring-1 ring-border">
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </section>
  );
}
