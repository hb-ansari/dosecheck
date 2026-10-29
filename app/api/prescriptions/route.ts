import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { NewPrescriptionSchema } from "@/lib/schema";

export async function GET() {
  try {
    const prescriptions = await store.listPrescriptions();
    return NextResponse.json(prescriptions);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = NewPrescriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const id = await store.createPrescription(parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
