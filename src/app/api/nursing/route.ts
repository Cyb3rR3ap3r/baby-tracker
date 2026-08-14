import { NextResponse } from "next/server";
import { getActiveNursing, nursingAction } from "@/lib/db";
import type { NursingAction, NursingSide } from "@/lib/nursing";

export const dynamic = "force-dynamic";

const ACTIONS: NursingAction[] = ["start", "switch", "pause", "resume", "complete", "discard"];

export async function GET() {
  return NextResponse.json({ session: getActiveNursing() });
}

export async function POST(req: Request) {
  let body: { action?: string; side?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.action || !ACTIONS.includes(body.action as NursingAction)) {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
  const side = body.side === "left" || body.side === "right" ? (body.side as NursingSide) : undefined;
  const result = nursingAction(body.action as NursingAction, side);
  return NextResponse.json(result);
}
