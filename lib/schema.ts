import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const SourceSchema = z.enum(["code", "gemma"]);
export type Source = z.infer<typeof SourceSchema>;

export const SeveritySchema = z.enum(["high", "medium", "low"]);
export type Severity = z.infer<typeof SeveritySchema>;

export const DecisionSchema = z.enum(["accepted", "corrected", "escalated"]);
export type Decision = z.infer<typeof DecisionSchema>;

export const DoseUnitSchema = z.enum(["mcg", "mg", "g", "units"]);
export type DoseUnit = z.infer<typeof DoseUnitSchema>;

// ---------------------------------------------------------------------------
// Finding
// ---------------------------------------------------------------------------
export const ResolutionSchema = z.object({
  decision: DecisionSchema,
  reason: z.string().min(5),
  by: z.string().min(1),
  at: z.string(),
});
export type Resolution = z.infer<typeof ResolutionSchema>;

export const FindingSchema = z.object({
  id: z.string().uuid(),
  source: SourceSchema,
  code: z.string().min(1),
  severity: SeveritySchema,
  title: z.string().min(1),
  evidence: z.string().min(1),
  explanation_en: z.string().min(1),
  explanation_ur: z.string().optional(),
  field_involved: z.string().optional(),
  resolution: ResolutionSchema.optional(),
});
export type Finding = z.infer<typeof FindingSchema>;

// ---------------------------------------------------------------------------
// GemmaMeta
// ---------------------------------------------------------------------------
export const GemmaMetaSchema = z.object({
  model: z.string(),
  latency_ms: z.number(),
  status: z.enum(["ok", "unavailable", "invalid_output"]),
  dropped_unverified: z.number().int().min(0),
  input_sent: z.unknown(),
});
export type GemmaMeta = z.infer<typeof GemmaMetaSchema>;

// ---------------------------------------------------------------------------
// Patient
// ---------------------------------------------------------------------------
export const PatientSchema = z.object({
  age_years: z.number().positive(),
  weight_kg: z.number().positive().nullable(),
  condition: z.string().optional(),
  allergies: z.array(z.string()).optional(),
});
export type Patient = z.infer<typeof PatientSchema>;

// ---------------------------------------------------------------------------
// Prescription
// ---------------------------------------------------------------------------
export const PrescriptionSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string(),
  isDemo: z.boolean(),
  patient: PatientSchema,
  drug: z.string().min(1),
  dose_value: z.number().positive(),
  dose_unit: DoseUnitSchema,
  dose_text_raw: z.string().min(1),
  frequency_per_day: z.number().positive().nullable(),
  frequency_text: z.string().min(1),
  concentration: z.string().optional(),
  route: z.string().optional(),
  note: z.string().max(2000),
  status: z.enum(["pending", "flagged", "released"]),
  findings: z.array(FindingSchema),
  gemmaMeta: GemmaMetaSchema.optional(),
});
export type Prescription = z.infer<typeof PrescriptionSchema>;

// ---------------------------------------------------------------------------
// NewPrescription — input to create
// ---------------------------------------------------------------------------
export const NewPrescriptionSchema = z.object({
  patient: PatientSchema,
  drug: z.string().min(1),
  dose_value: z.number().positive("Dose value must be positive"),
  dose_unit: DoseUnitSchema,
  dose_text_raw: z.string().min(1),
  frequency_per_day: z.number().positive().nullable(),
  frequency_text: z.string().min(1),
  concentration: z.string().optional(),
  route: z.string().optional(),
  note: z.string().max(2000),
});
export type NewPrescription = z.infer<typeof NewPrescriptionSchema>;

// ---------------------------------------------------------------------------
// PrescriptionWithCounts — for queue listing
// ---------------------------------------------------------------------------
export interface PrescriptionWithCounts {
  id: string;
  createdAt: string;
  isDemo: boolean;
  patient: Patient;
  drug: string;
  dose_value: number;
  dose_unit: DoseUnit;
  frequency_text: string;
  status: "pending" | "flagged" | "released";
  codeFindings: number;
  gemmaFindings: number;
  resolvedFindings: number;
}

// ---------------------------------------------------------------------------
// AuditEntry
// ---------------------------------------------------------------------------
export const AuditEntrySchema = z.object({
  id: z.number(),
  at: z.string(),
  by: z.string(),
  prescriptionId: z.string(),
  findingId: z.string().optional(),
  source: SourceSchema.optional(),
  action: z.string(),
  decision: DecisionSchema.optional(),
  reason: z.string().optional(),
});
export type AuditEntry = z.infer<typeof AuditEntrySchema>;

// ---------------------------------------------------------------------------
// API request/response schemas
// ---------------------------------------------------------------------------
export const CheckRequestSchema = z.object({
  id: z.string().uuid().optional(), // if re-checking
  by: z.string().min(1).default("anonymous"),
  patient: PatientSchema,
  drug: z.string().min(1),
  dose_value: z.number().positive(),
  dose_unit: DoseUnitSchema,
  dose_text_raw: z.string().min(1),
  frequency_per_day: z.number().positive().nullable(),
  frequency_text: z.string().min(1),
  concentration: z.string().optional(),
  route: z.string().optional(),
  note: z.string().max(2000),
});
export type CheckRequest = z.infer<typeof CheckRequestSchema>;

export const ResolveRequestSchema = z.object({
  findingId: z.string().uuid(),
  decision: DecisionSchema,
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  by: z.string().min(1),
});
export type ResolveRequest = z.infer<typeof ResolveRequestSchema>;

export const ReleaseRequestSchema = z.object({
  prescriptionId: z.string().uuid(),
  by: z.string().min(1),
});
export type ReleaseRequest = z.infer<typeof ReleaseRequestSchema>;

// ---------------------------------------------------------------------------
// Gemma response schema (raw from API)
// ---------------------------------------------------------------------------
export const GemmaFindingRawSchema = z.object({
  code: z.enum(["NOTE_ENTRY_MISMATCH", "ALLERGY_CONFLICT", "CONTEXT_IMPLAUSIBLE", "OTHER_CONTEXT"]),
  title: z.string().min(1),
  evidence_quote: z.string().min(1),
  field_involved: z.string().optional(),
  explanation_en: z.string().min(1),
  explanation_ur: z.string().optional(),
});
export type GemmaFindingRaw = z.infer<typeof GemmaFindingRawSchema>;

export const GemmaResponseSchema = z.object({
  findings: z.array(GemmaFindingRawSchema),
});
export type GemmaResponse = z.infer<typeof GemmaResponseSchema>;
