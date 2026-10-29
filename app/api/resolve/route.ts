import { NextResponse } from "next/server";
import { ResolveRequestSchema } from "@/lib/schema";
import { store } from "@/lib/store";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ResolveRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { findingId, decision, reason, by } = parsed.data;

  try {
    await store.resolveFinding(findingId, decision, reason, by);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const e = err as Error;
    if (e.name === "ALREADY_RELEASED") {
      return NextResponse.json({ error: "Prescription has already been released" }, { status: 409 });
    }
    if (e.name === "NOT_FOUND") {
      return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }
    console.error("[/api/resolve] Unexpected error:", e.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
