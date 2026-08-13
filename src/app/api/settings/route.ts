import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/db";
import type { Settings } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function PUT(req: Request) {
  let patch: Partial<Settings>;
  try {
    patch = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  return NextResponse.json(saveSettings(patch));
}
