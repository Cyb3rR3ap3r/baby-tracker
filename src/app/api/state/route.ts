import { NextResponse } from "next/server";
import { getFullState } from "@/lib/db";

export const dynamic = "force-dynamic";

// One call returns everything the client needs on load / poll (including any
// in-progress nursing session).
export async function GET() {
  return NextResponse.json(getFullState());
}
