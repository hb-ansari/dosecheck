import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryStore } from "@/lib/store";
import type { Finding, GemmaMeta } from "@/lib/schema";

const dummyMeta: GemmaMeta = {
  model: "gemma-test",
  latency_ms: 100,
  status: "ok",
  dropped_unverified: 0,
  input_sent: {},
};

function makeFinding(id: string): Finding {
  return {
    id,
    source: "code",
    code: "TEST",
    severity: "high",
    title: "Test Finding",
    evidence: "test evidence",
    explanation_en: "test explanation",
  };
}

describe("Release Gate (InMemoryStore)", () => {
  let store: InMemoryStore;
  let prescriptionId: string;

  beforeEach(async () => {
    store = new InMemoryStore();
    prescriptionId = await store.createPrescription({
      patient: { age_years: 30, weight_kg: 70 },
      drug: "paracetamol",
      dose_value: 500,
      dose_unit: "mg",
      dose_text_raw: "500 mg",
      frequency_per_day: 3,
      frequency_text: "three times daily",
      note: "for pain",
    });
  });

  it("refuses release when there are unresolved findings (throws UNRESOLVED_FINDINGS)", async () => {
    const finding = makeFinding("f-1");
    await store.saveCheckResult(prescriptionId, [finding], dummyMeta, "pharmacist");

    await expect(store.releasePrescription(prescriptionId, "pharmacist")).rejects.toMatchObject({
      name: "UNRESOLVED_FINDINGS",
    });
  });

  it("allows release when all findings are resolved", async () => {
    const finding = makeFinding("f-2");
    await store.saveCheckResult(prescriptionId, [finding], dummyMeta, "pharmacist");
    await store.resolveFinding("f-2", "accepted", "Checked and safe", "pharmacist");

    await expect(store.releasePrescription(prescriptionId, "pharmacist")).resolves.toBeUndefined();

    const rx = await store.getPrescription(prescriptionId);
    expect(rx?.status).toBe("released");
  });

  it("allows release when there are no findings at all", async () => {
    await store.saveCheckResult(prescriptionId, [], dummyMeta, "pharmacist");
    await expect(store.releasePrescription(prescriptionId, "pharmacist")).resolves.toBeUndefined();
  });

  it("refuses a second release (throws ALREADY_RELEASED)", async () => {
    await store.saveCheckResult(prescriptionId, [], dummyMeta, "pharmacist");
    await store.releasePrescription(prescriptionId, "pharmacist");

    await expect(store.releasePrescription(prescriptionId, "pharmacist")).rejects.toMatchObject({
      name: "ALREADY_RELEASED",
    });
  });

  it("returns 409-style error name for unresolved findings", async () => {
    const finding = makeFinding("f-3");
    await store.saveCheckResult(prescriptionId, [finding], dummyMeta, "pharmacist");

    try {
      await store.releasePrescription(prescriptionId, "pharmacist");
      throw new Error("Should not reach here");
    } catch (err) {
      expect((err as Error).name).toBe("UNRESOLVED_FINDINGS");
    }
  });
});
