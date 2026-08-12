import { NextResponse } from "next/server";
import { getBaby, saveBaby } from "@/lib/db";
import type { Baby } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getBaby());
}

export async function PUT(req: Request) {
  let patch: Partial<Baby>;
  try {
    patch = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  return NextResponse.json(saveBaby(patch));
}
