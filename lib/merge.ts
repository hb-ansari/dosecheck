import type { Finding } from "@/lib/schema";

/**
 * Merge code findings and Gemma findings:
 * 1. Deduplicate: if two findings share the same (code, field_involved), keep the "code" source one.
 * 2. Sort: severity (high → medium → low), then source (code before gemma).
 */
export function mergeFindings(
  codeFindings: Finding[],
  gemmaFindings: Finding[]
): Finding[] {
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sourceOrder: Record<string, number> = { code: 0, gemma: 1 };

  // Build a map keyed by "code|field_involved" for deduplication
  const seen = new Map<string, Finding>();

  // Code findings take priority — insert first
  for (const f of codeFindings) {
    const key = `${f.code}|${f.field_involved ?? ""}`;
    seen.set(key, f);
  }

  // Gemma findings only added if key not already present
  for (const f of gemmaFindings) {
    const key = `${f.code}|${f.field_involved ?? ""}`;
    if (!seen.has(key)) {
      seen.set(key, f);
    }
  }

  return [...seen.values()].sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return sourceOrder[a.source] - sourceOrder[b.source];
  });
}
