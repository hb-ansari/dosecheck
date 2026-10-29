import { describe, it, expect } from "vitest";
import { mergeFindings } from "@/lib/merge";
import type { Finding } from "@/lib/schema";

function makeFinding(overrides: Partial<Finding>): Finding {
  return {
    id: Math.random().toString(),
    source: "code",
    code: "TEST_CODE",
    severity: "medium",
    title: "Test",
    evidence: "test evidence",
    explanation_en: "test explanation",
    ...overrides,
  };
}

describe("mergeFindings", () => {
  it("returns empty array when both inputs are empty", () => {
    expect(mergeFindings([], [])).toHaveLength(0);
  });

  it("returns code findings only when no gemma findings", () => {
    const code = [makeFinding({ code: "A", source: "code" })];
    expect(mergeFindings(code, [])).toHaveLength(1);
  });

  it("returns gemma findings only when no code findings", () => {
    const gemma = [makeFinding({ code: "B", source: "gemma" })];
    expect(mergeFindings([], gemma)).toHaveLength(1);
  });

  it("deduplicates identical code+field_involved pair, keeps code source", () => {
    const codeFinding = makeFinding({
      code: "DUPE",
      source: "code",
      field_involved: "dose_value",
      severity: "high",
    });
    const gemmaFinding = makeFinding({
      code: "DUPE",
      source: "gemma",
      field_involved: "dose_value",
      severity: "medium",
    });
    const result = mergeFindings([codeFinding], [gemmaFinding]);
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("code");
  });

  it("does NOT deduplicate when field_involved differs", () => {
    const c = makeFinding({ code: "FOO", source: "code", field_involved: "dose_value" });
    const g = makeFinding({ code: "FOO", source: "gemma", field_involved: "frequency" });
    expect(mergeFindings([c], [g])).toHaveLength(2);
  });

  it("sorts by severity: high before medium before low", () => {
    const low = makeFinding({ code: "A", severity: "low" });
    const high = makeFinding({ code: "B", severity: "high" });
    const med = makeFinding({ code: "C", severity: "medium" });
    const result = mergeFindings([low, high, med], []);
    expect(result[0].severity).toBe("high");
    expect(result[1].severity).toBe("medium");
    expect(result[2].severity).toBe("low");
  });

  it("within same severity, sorts code before gemma", () => {
    const gemma = makeFinding({ code: "A", source: "gemma", severity: "medium" });
    const code = makeFinding({ code: "B", source: "code", severity: "medium" });
    const result = mergeFindings([code], [gemma]);
    expect(result[0].source).toBe("code");
    expect(result[1].source).toBe("gemma");
  });

  it("combines code and gemma with correct dedup and sort", () => {
    const c1 = makeFinding({ code: "HIGH_CODE", source: "code", severity: "high" });
    const c2 = makeFinding({ code: "MED_CODE", source: "code", severity: "medium" });
    const g1 = makeFinding({ code: "MED_CODE", source: "gemma", severity: "medium", field_involved: undefined }); // dupe
    const g2 = makeFinding({ code: "LOW_GEMMA", source: "gemma", severity: "low" });
    const result = mergeFindings([c1, c2], [g1, g2]);
    // c1=high, c2=medium (g1 deduped), g2=low
    expect(result).toHaveLength(3);
    expect(result[0].code).toBe("HIGH_CODE");
    expect(result[1].code).toBe("MED_CODE");
    expect(result[1].source).toBe("code");
    expect(result[2].code).toBe("LOW_GEMMA");
  });
});
