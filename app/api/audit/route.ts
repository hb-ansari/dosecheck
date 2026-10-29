import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prescriptionId = searchParams.get("prescriptionId") ?? undefined;

  try {
    const entries = await store.listAudit(prescriptionId);
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
