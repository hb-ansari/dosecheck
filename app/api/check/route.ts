import { NextResponse } from "next/server";
import { CheckRequestSchema } from "@/lib/schema";
import { runCodeChecks } from "@/lib/checks";
import { runGemmaCheck } from "@/lib/gemma";
import { mergeFindings } from "@/lib/merge";
import { store } from "@/lib/store";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

export const maxDuration = 30; // Vercel timeout in seconds

export async function POST(request: Request) {
  // Rate limiting
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait before submitting another prescription." },
      { status: 429 }
    );
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CheckRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    // Create or re-use prescription
    let prescriptionId = data.id;
    if (!prescriptionId) {
      prescriptionId = await store.createPrescription({
        patient: data.patient,
        drug: data.drug,
        dose_value: data.dose_value,
        dose_unit: data.dose_unit,
        dose_text_raw: data.dose_text_raw,
        frequency_per_day: data.frequency_per_day,
        frequency_text: data.frequency_text,
        concentration: data.concentration,
        route: data.route,
        note: data.note,
      });
    }

    // Run deterministic checks
    const codeFindings = runCodeChecks(data);

    // Run Gemma contextual check (always, even if code found errors)
    const { findings: gemmaFindings, meta: gemmaMeta } = await runGemmaCheck(data, codeFindings);

    // Merge: dedupe + sort
    const merged = mergeFindings(codeFindings, gemmaFindings);

    // Persist results via SQL function
    await store.saveCheckResult(prescriptionId, merged, gemmaMeta, data.by);

    // Return the full prescription
    const prescription = await store.getPrescription(prescriptionId);
    return NextResponse.json(prescription, { status: 200 });
  } catch (err) {
    const e = err as Error;
    if (e.name === "ALREADY_RELEASED") {
      return NextResponse.json({ error: "Prescription has already been released" }, { status: 409 });
    }
    if (e.name === "NOT_FOUND") {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }
    console.error("[/api/check] Unexpected error:", e.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
