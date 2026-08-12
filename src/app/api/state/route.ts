import { NextResponse } from "next/server";
import { getState } from "@/lib/db";

export const dynamic = "force-dynamic";

// One call returns everything the client needs on load / poll.
export async function GET() {
  return NextResponse.json(getState());
}
