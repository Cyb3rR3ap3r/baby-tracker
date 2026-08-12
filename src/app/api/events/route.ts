import { NextResponse } from "next/server";
import { listEvents, upsertEvent } from "@/lib/db";
import type { BabyEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(listEvents());
}

export async function POST(req: Request) {
  let body: Partial<BabyEvent>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body.id !== "string" || typeof body.type !== "string") {
    return NextResponse.json({ error: "id and type are required" }, { status: 400 });
  }
  const saved = upsertEvent(body as BabyEvent);
  return NextResponse.json(saved, { status: 201 });
}
