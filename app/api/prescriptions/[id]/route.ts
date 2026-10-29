import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const prescription = await store.getPrescription(id);
    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }
    return NextResponse.json(prescription);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
