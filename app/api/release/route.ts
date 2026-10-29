import { NextResponse } from "next/server";
import { ReleaseRequestSchema } from "@/lib/schema";
import { store } from "@/lib/store";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ReleaseRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { prescriptionId, by } = parsed.data;

  try {
    await store.releasePrescription(prescriptionId, by);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const e = err as Error;
    if (e.name === "UNRESOLVED_FINDINGS") {
      return NextResponse.json(
        { error: "Cannot release: there are unresolved findings that require pharmacist review." },
        { status: 409 }
      );
    }
    if (e.name === "ALREADY_RELEASED") {
      return NextResponse.json(
        { error: "This prescription has already been released." },
        { status: 409 }
      );
    }
    if (e.name === "NOT_FOUND") {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }
    console.error("[/api/release] Unexpected error:", e.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
