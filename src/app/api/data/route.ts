import { NextResponse } from "next/server";
import { clearEvents, getState, replaceAll } from "@/lib/db";
import type { AppData } from "@/lib/types";

export const dynamic = "force-dynamic";

// Import / restore: replace everything with the posted backup.
export async function POST(req: Request) {
  let body: AppData;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body || !Array.isArray(body.events)) {
    return NextResponse.json({ error: "expected an events array" }, { status: 400 });
  }
  return NextResponse.json(replaceAll(body));
}

// Clear all entries (keeps baby profile + settings).
export async function DELETE() {
  clearEvents();
  return NextResponse.json(getState());
}
