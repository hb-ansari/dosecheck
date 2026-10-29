import "server-only";
import type {
  Prescription,
  PrescriptionWithCounts,
  Finding,
  GemmaMeta,
  AuditEntry,
  Decision,
  NewPrescription,
} from "@/lib/schema";
import { db } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------
export interface Store {
  listPrescriptions(): Promise<PrescriptionWithCounts[]>;
  getPrescription(id: string): Promise<Prescription | null>;
  createPrescription(input: NewPrescription, opts?: { isDemo?: boolean }): Promise<string>;
  saveCheckResult(id: string, findings: Finding[], meta: GemmaMeta, by: string): Promise<void>;
  resolveFinding(findingId: string, decision: Decision, reason: string, by: string): Promise<void>;
  releasePrescription(id: string, by: string): Promise<void>;
  listAudit(prescriptionId?: string): Promise<AuditEntry[]>;
  resetDemo(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Map DB snake_case row → camelCase Finding
// ---------------------------------------------------------------------------
function mapFinding(row: any): Finding {
  return {
    id: row.id,
    source: row.source,
    code: row.code,
    severity: row.severity,
    title: row.title,
    evidence: row.evidence,
    explanation_en: row.explanation_en,
    explanation_ur: row.explanation_ur ?? undefined,
    field_involved: row.field_involved ?? undefined,
    resolution:
      row.decision
        ? {
            decision: row.decision,
            reason: row.reason,
            by: row.resolved_by,
            at: row.resolved_at,
          }
        : undefined,
  };
}

// ---------------------------------------------------------------------------
// Map DB row → camelCase Prescription
// ---------------------------------------------------------------------------
function mapPrescription(row: any): Prescription {
  return {
    id: row.id,
    createdAt: row.created_at,
    isDemo: row.is_demo,
    patient: row.patient,
    drug: row.drug,
    dose_value: row.dose_value,
    dose_unit: row.dose_unit,
    dose_text_raw: row.dose_text_raw,
    frequency_per_day: row.frequency_per_day ?? null,
    frequency_text: row.frequency_text,
    concentration: row.concentration ?? undefined,
    route: row.route ?? undefined,
    note: row.note,
    status: row.status,
    findings: (row.findings ?? []).map(mapFinding),
    gemmaMeta: row.gemma_meta ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Map DB error → app error code
// ---------------------------------------------------------------------------
function mapDbError(err: unknown): Error {
  const msg = (err as { message?: string })?.message ?? "Unknown error";
  if (msg.includes("UNRESOLVED_FINDINGS")) {
    const e = new Error("UNRESOLVED_FINDINGS");
    e.name = "UNRESOLVED_FINDINGS";
    return e;
  }
  if (msg.includes("ALREADY_RELEASED")) {
    const e = new Error("ALREADY_RELEASED");
    e.name = "ALREADY_RELEASED";
    return e;
  }
  if (msg.includes("NOT_FOUND")) {
    const e = new Error("NOT_FOUND");
    e.name = "NOT_FOUND";
    return e;
  }
  // Never leak raw SQL errors
  return new Error("Internal database error");
}

// ---------------------------------------------------------------------------
// Supabase Store implementation
// ---------------------------------------------------------------------------
export class SupabaseStore implements Store {
  async listPrescriptions(): Promise<PrescriptionWithCounts[]> {
    const { data, error } = await db()
      .from("prescriptions")
      .select("id, created_at, is_demo, patient, drug, dose_value, dose_unit, frequency_text, status, findings(id, source, decision)")
      .order("created_at", { ascending: false });

    if (error) throw mapDbError(error);

    return (data ?? []).map((row: any) => ({
      id: row.id,
      createdAt: row.created_at,
      isDemo: row.is_demo,
      patient: row.patient,
      drug: row.drug,
      dose_value: row.dose_value,
      dose_unit: row.dose_unit,
      frequency_text: row.frequency_text,
      status: row.status,
      codeFindings: (row.findings ?? []).filter((f: { source: string }) => f.source === "code").length,
      gemmaFindings: (row.findings ?? []).filter((f: { source: string }) => f.source === "gemma").length,
      resolvedFindings: (row.findings ?? []).filter((f: { decision: string | null }) => f.decision !== null).length,
    }));
  }

  async getPrescription(id: string): Promise<Prescription | null> {
    const { data, error } = await db()
      .from("prescriptions")
      .select("*, findings(*)")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw mapDbError(error);
    }
    return mapPrescription(data);
  }

  async createPrescription(input: NewPrescription, opts?: { isDemo?: boolean }): Promise<string> {
    const { data, error } = await db()
      .from("prescriptions")
      .insert({
        is_demo: opts?.isDemo ?? false,
        patient: input.patient,
        drug: input.drug,
        dose_value: input.dose_value,
        dose_unit: input.dose_unit,
        dose_text_raw: input.dose_text_raw,
        frequency_per_day: input.frequency_per_day,
        frequency_text: input.frequency_text,
        concentration: input.concentration ?? null,
        route: input.route ?? null,
        note: input.note,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw mapDbError(error);
    return data.id as string;
  }

  async saveCheckResult(id: string, findings: Finding[], meta: GemmaMeta, by: string): Promise<void> {
    const findingsPayload = findings.map((f) => ({
      source: f.source,
      code: f.code,
      severity: f.severity,
      title: f.title,
      evidence: f.evidence,
      explanation_en: f.explanation_en,
      explanation_ur: f.explanation_ur ?? null,
      field_involved: f.field_involved ?? null,
    }));

    const { error } = await db().rpc("save_check_result", {
      p_id: id,
      p_findings: findingsPayload,
      p_gemma_meta: meta,
      p_by: by,
    });

    if (error) throw mapDbError(error);
  }

  async resolveFinding(findingId: string, decision: Decision, reason: string, by: string): Promise<void> {
    const { error } = await db().rpc("resolve_finding", {
      p_finding_id: findingId,
      p_decision: decision,
      p_reason: reason,
      p_by: by,
    });

    if (error) throw mapDbError(error);
  }

  async releasePrescription(id: string, by: string): Promise<void> {
    const { error } = await db().rpc("release_prescription", {
      p_id: id,
      p_by: by,
    });

    if (error) throw mapDbError(error);
  }

  async listAudit(prescriptionId?: string): Promise<AuditEntry[]> {
    let query = db()
      .from("audit_log")
      .select("*")
      .order("at", { ascending: false });

    if (prescriptionId) {
      query = query.eq("prescription_id", prescriptionId);
    }

    const { data, error } = await query;
    if (error) throw mapDbError(error);

    return (data ?? []).map((row: any) => ({
      id: row.id,
      at: row.at,
      by: row.by_name,
      prescriptionId: row.prescription_id,
      findingId: row.finding_id ?? undefined,
      source: row.source ?? undefined,
      action: row.action,
      decision: row.decision ?? undefined,
      reason: row.reason ?? undefined,
    }));
  }

  async resetDemo(): Promise<void> {
    // Delete all demo rows — cascade clears findings; audit rows are deletable for demo rows
    const { error: delError } = await db()
      .from("prescriptions")
      .delete()
      .eq("is_demo", true);

    if (delError) throw mapDbError(delError);

    // Also delete demo audit rows (the trigger allows this)
    const { error: auditDelError } = await db()
      .from("audit_log")
      .delete()
      .eq("is_demo", true);

    if (auditDelError) throw mapDbError(auditDelError);

    // Re-insert demo prescriptions and run check flow on each
    const { default: demoPrescriptions } = await import("@/data/prescriptions.json");
    const { runCodeChecks } = await import("@/lib/checks");
    const { runGemmaCheck } = await import("@/lib/gemma");
    const { mergeFindings } = await import("@/lib/merge");

    for (const rx of demoPrescriptions as NewPrescription[]) {
      const id = await this.createPrescription(rx, { isDemo: true });
      const codeFindings = runCodeChecks(rx);
      const { findings: gemmaFindings, meta } = await runGemmaCheck(rx, codeFindings);
      const merged = mergeFindings(codeFindings, gemmaFindings);
      await this.saveCheckResult(id, merged, meta, "demo-system");
    }
  }
}

// ---------------------------------------------------------------------------
// In-Memory Store — for tests only
// ---------------------------------------------------------------------------
export class InMemoryStore implements Store {
  private prescriptions: Map<string, Prescription> = new Map();
  private auditLog: AuditEntry[] = [];
  private nextAuditId = 1;

  async listPrescriptions(): Promise<PrescriptionWithCounts[]> {
    return [...this.prescriptions.values()].map((p) => ({
      id: p.id,
      createdAt: p.createdAt,
      isDemo: p.isDemo,
      patient: p.patient,
      drug: p.drug,
      dose_value: p.dose_value,
      dose_unit: p.dose_unit,
      frequency_text: p.frequency_text,
      status: p.status,
      codeFindings: p.findings.filter((f) => f.source === "code").length,
      gemmaFindings: p.findings.filter((f) => f.source === "gemma").length,
      resolvedFindings: p.findings.filter((f) => f.resolution !== undefined).length,
    }));
  }

  async getPrescription(id: string): Promise<Prescription | null> {
    return this.prescriptions.get(id) ?? null;
  }

  async createPrescription(input: NewPrescription, opts?: { isDemo?: boolean }): Promise<string> {
    const id = `mem-${Math.random().toString(36).slice(2)}`;
    this.prescriptions.set(id, {
      id,
      createdAt: new Date().toISOString(),
      isDemo: opts?.isDemo ?? false,
      ...input,
      status: "pending",
      findings: [],
    });
    return id;
  }

  async saveCheckResult(id: string, findings: Finding[], meta: GemmaMeta, by: string): Promise<void> {
    const rx = this.prescriptions.get(id);
    if (!rx) { const e = new Error("NOT_FOUND"); e.name = "NOT_FOUND"; throw e; }
    if (rx.status === "released") { const e = new Error("ALREADY_RELEASED"); e.name = "ALREADY_RELEASED"; throw e; }

    this.prescriptions.set(id, {
      ...rx,
      findings,
      gemmaMeta: meta,
      status: findings.length > 0 ? "flagged" : "pending",
    });
    this._addAudit({ by, prescriptionId: id, action: "check_run", reason: `${findings.length} findings` });
  }

  async resolveFinding(findingId: string, decision: Decision, reason: string, by: string): Promise<void> {
    for (const [pid, rx] of this.prescriptions.entries()) {
      if (rx.status === "released") { const e = new Error("ALREADY_RELEASED"); e.name = "ALREADY_RELEASED"; throw e; }
      const idx = rx.findings.findIndex((f) => f.id === findingId);
      if (idx !== -1) {
        const updated = [...rx.findings];
        updated[idx] = { ...updated[idx], resolution: { decision, reason, by, at: new Date().toISOString() } };
        this.prescriptions.set(pid, { ...rx, findings: updated });
        this._addAudit({ by, prescriptionId: pid, findingId, action: "resolve", decision });
        return;
      }
    }
    const e = new Error("NOT_FOUND"); e.name = "NOT_FOUND"; throw e;
  }

  async releasePrescription(id: string, by: string): Promise<void> {
    const rx = this.prescriptions.get(id);
    if (!rx) { const e = new Error("NOT_FOUND"); e.name = "NOT_FOUND"; throw e; }
    if (rx.status === "released") { const e = new Error("ALREADY_RELEASED"); e.name = "ALREADY_RELEASED"; throw e; }

    const unresolved = rx.findings.filter((f) => !f.resolution);
    if (unresolved.length > 0) {
      const e = new Error("UNRESOLVED_FINDINGS"); e.name = "UNRESOLVED_FINDINGS"; throw e;
    }

    this.prescriptions.set(id, { ...rx, status: "released" });
    this._addAudit({ by, prescriptionId: id, action: "release" });
  }

  async listAudit(prescriptionId?: string): Promise<AuditEntry[]> {
    if (prescriptionId) return this.auditLog.filter((e) => e.prescriptionId === prescriptionId);
    return this.auditLog;
  }

  async resetDemo(): Promise<void> {
    for (const [id, rx] of this.prescriptions.entries()) {
      if (rx.isDemo) this.prescriptions.delete(id);
    }
  }

  private _addAudit(entry: Omit<AuditEntry, "id" | "at">) {
    this.auditLog.unshift({ ...entry, id: this.nextAuditId++, at: new Date().toISOString() });
  }
}

// Singleton for production use
export const store: Store = new SupabaseStore();
