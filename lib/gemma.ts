import "server-only";
import { GoogleGenAI } from "@google/genai";
import { v4 as uuid } from "uuid";
import {
  GemmaResponseSchema,
  type GemmaResponse,
  type Finding,
  type GemmaMeta,
  type NewPrescription,
} from "@/lib/schema";
import { buildPayload, buildPrompt } from "@/lib/prompt";

const TIMEOUT_MS = 20_000;

/**
 * Strip accidental markdown fences from Gemma output.
 * Some models wrap JSON in ```json ... ```
 */
function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

/**
 * Normalize whitespace for evidence guard comparison.
 */
function normalizeWs(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Check whether a quote is a verbatim substring of the searchable text.
 */
function isVerifiableQuote(quote: string, searchText: string): boolean {
  return normalizeWs(searchText).includes(normalizeWs(quote));
}

/**
 * Parse and validate Gemma's JSON response.
 * Returns null if invalid after two attempts.
 */
async function parseGemmaResponse(
  text: string
): Promise<GemmaResponse | null> {
  const stripped = stripFences(text);
  try {
    const parsed = JSON.parse(stripped);
    const validated = GemmaResponseSchema.safeParse(parsed);
    if (validated.success) return validated.data;
    return null;
  } catch {
    return null;
  }
}

/**
 * Call Gemma 4 for a contextual review of the prescription.
 * Always runs after code checks. Fails gracefully — never throws to caller.
 */
export async function runGemmaCheck(
  rx: NewPrescription,
  codeFindings: Finding[]
): Promise<{ findings: Finding[]; meta: GemmaMeta }> {
  const startMs = Date.now();

  const model = process.env.GEMMA_MODEL;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!model || !apiKey) {
    return {
      findings: [],
      meta: {
        model: model ?? "unknown",
        latency_ms: 0,
        status: "unavailable",
        dropped_unverified: 0,
        input_sent: null,
      },
    };
  }

  const payload = buildPayload(rx, codeFindings);
  const prompt = buildPrompt(payload);
  const genai = new GoogleGenAI({ apiKey });

  let responseText: string | null = null;

  try {
    // AbortController timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      // Primary: try with systemInstruction + JSON response mode
      const response = await genai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });
      responseText = response.text ?? null;
    } catch {
      // Fallback: single user message, parse text output
      const response = await genai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { temperature: 0.1 },
      });
      responseText = response.text ?? null;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    const latency_ms = Date.now() - startMs;
    const isTimeout = (err as Error)?.name === "AbortError";
    console.error("[Gemma] API error:", isTimeout ? "timeout" : err);

    return {
      findings: [],
      meta: {
        model,
        latency_ms,
        status: "unavailable",
        dropped_unverified: 0,
        input_sent: payload,
      },
    };
  }

  const latency_ms = Date.now() - startMs;

  if (!responseText) {
    return {
      findings: [],
      meta: {
        model,
        latency_ms,
        status: "invalid_output",
        dropped_unverified: 0,
        input_sent: payload,
      },
    };
  }

  // Parse — retry once on failure
  let parsed = await parseGemmaResponse(responseText);
  if (!parsed) {
    // One retry: call again
    try {
      const retryResponse = await genai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { temperature: 0 },
      });
      const retryText = retryResponse.text ?? "";
      parsed = await parseGemmaResponse(retryText);
    } catch {
      parsed = null;
    }
  }

  if (!parsed) {
    return {
      findings: [],
      meta: {
        model,
        latency_ms,
        status: "invalid_output",
        dropped_unverified: 0,
        input_sent: payload,
      },
    };
  }

  // Build searchable text corpus for evidence guard
  const searchableText = [
    rx.note,
    rx.drug,
    String(rx.dose_value),
    rx.dose_unit,
    rx.frequency_text,
    rx.concentration ?? "",
    rx.route ?? "",
    JSON.stringify(rx.patient),
  ].join(" ");

  let dropped_unverified = 0;
  const findings: Finding[] = [];

  for (const raw of parsed.findings) {
    // Evidence guard — drop hallucinated evidence
    if (!isVerifiableQuote(raw.evidence_quote, searchableText)) {
      dropped_unverified++;
      console.warn(`[Gemma] Dropped finding "${raw.code}": evidence_quote not found in input`);
      continue;
    }

    // Require non-empty Urdu explanation
    if (!raw.explanation_ur?.trim()) {
      dropped_unverified++;
      console.warn(`[Gemma] Dropped finding "${raw.code}": missing explanation_ur`);
      continue;
    }

    findings.push({
      id: uuid(),
      source: "gemma",
      code: raw.code,
      severity: "medium",
      title: raw.title,
      evidence: raw.evidence_quote,
      explanation_en: raw.explanation_en,
      explanation_ur: raw.explanation_ur,
      field_involved: raw.field_involved,
    });
  }

  return {
    findings,
    meta: {
      model,
      latency_ms,
      status: "ok",
      dropped_unverified,
      input_sent: payload,
    },
  };
}
