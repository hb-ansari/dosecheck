"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DoseUnit } from "@/lib/schema";

const DRUGS = ["paracetamol", "ibuprofen", "amoxicillin", "methotrexate", "digoxin", "morphine", "heparin"];
const UNITS: DoseUnit[] = ["mg", "mcg", "g", "units"];
const ROUTES = ["Oral", "IV", "IM", "SC", "Topical", "Inhaled", "Sublingual", "Rectal", "Nasal"];

type LoadingPhase = null | "code" | "gemma" | "done";

export default function NewPrescriptionPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<LoadingPhase>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewerName] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("dosecheck_reviewer") || "Pharmacist" : "Pharmacist"
  );

  const [form, setForm] = useState({
    age_years: "",
    weight_kg: "",
    condition: "",
    allergies: "",
    drug: "",
    dose_value: "",
    dose_unit: "mg" as DoseUnit,
    dose_text_raw: "",
    frequency_per_day: "",
    frequency_text: "",
    concentration: "",
    route: "Oral",
    note: "",
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.drug || !form.dose_value || !form.note || !form.frequency_text) {
      setError("Please fill all required fields (Drug, Dose, Frequency, and Doctor's Note).");
      return;
    }

    try {
      setPhase("code");
      await new Promise(r => setTimeout(r, 800));
      setPhase("gemma");

      const payload = {
        by: reviewerName,
        patient: {
          age_years: parseFloat(form.age_years) || 30,
          weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
          condition: form.condition || undefined,
          allergies: form.allergies ? form.allergies.split(",").map(a => a.trim()).filter(Boolean) : undefined,
        },
        drug: form.drug.toLowerCase(),
        dose_value: parseFloat(form.dose_value),
        dose_unit: form.dose_unit,
        dose_text_raw: form.dose_text_raw || `${form.dose_value} ${form.dose_unit}`,
        frequency_per_day: form.frequency_per_day ? parseFloat(form.frequency_per_day) : null,
        frequency_text: form.frequency_text,
        concentration: form.concentration || undefined,
        route: form.route || undefined,
        note: form.note,
      };

      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      setPhase("done");
      setTimeout(() => router.push(`/review/${data.id}`), 400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed. Try again.");
      setPhase(null);
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <Link href="/" style={{ fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}>← Review Queue</Link>
            <span style={{ color: "var(--border)" }}>/</span>
            <span style={{ fontSize: "12px", color: "var(--brand)", fontWeight: 600 }}>New Prescription</span>
          </div>
          <h1 className="page-title">New Prescription Entry</h1>
          <p className="page-subtitle">Submit a synthetic prescription for deterministic safety checks + Gemma 4 AI contextual review</p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="alert-banner">
        ⚠️ <strong>Synthetic Data Only:</strong> Do NOT enter real patient or prescription information. This is a prototype decision-support tool.
      </div>

      {/* Loading Overlay */}
      {phase && phase !== "done" && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(255,255,255,0.92)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          zIndex: 1000, gap: "16px"
        }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, borderTopColor: "var(--brand)" }}></div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
              {phase === "code" && "💻 Running deterministic safety checks..."}
              {phase === "gemma" && "✦ Gemma 4 is reviewing clinical context..."}
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" }}>
              {phase === "code" && "Checking dose limits, weight-based rules, format risks..."}
              {phase === "gemma" && "Analyzing doctor's note for contradictions and conflicts..."}
            </div>
          </div>
          {/* Steps */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", background: "#eef2ff", color: "#4f46e5", fontSize: "12px", fontWeight: 600 }}>
              <span>{phase === "code" ? <span className="spinner spinner-code" style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #c7d2fe", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}></span> : "✓"}</span>
              Code Checks
            </div>
            <div style={{ width: 24, height: 1, background: "#e0e7ff" }}></div>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px",
              background: phase === "gemma" ? "#f5f3ff" : "#f3f4f6", color: phase === "gemma" ? "#7c3aed" : "var(--text-muted)",
              fontSize: "12px", fontWeight: 600, transition: "all 0.3s"
            }}>
              {phase === "gemma" ? <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #ddd6fe", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}></span> : "✦"}
              Gemma 4 AI Review
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

          {/* Patient Information */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">👤 Patient Information</div>
                <div className="card-subtitle">Demographics for dose-based safety checks</div>
              </div>
            </div>
            <div className="card-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Age (years) <span className="form-required">*</span></label>
                  <input className="form-input" type="number" min="0" max="120" step="0.5" required
                    placeholder="e.g. 35" value={form.age_years} onChange={e => set("age_years", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input className="form-input" type="number" min="0" step="0.1"
                    placeholder="e.g. 70" value={form.weight_kg} onChange={e => set("weight_kg", e.target.value)} />
                  <div className="form-hint">Required for patients under 18</div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Condition / Diagnosis</label>
                <input className="form-input" placeholder="e.g. Rheumatoid Arthritis"
                  value={form.condition} onChange={e => set("condition", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Known Allergies</label>
                <input className="form-input" placeholder="e.g. penicillin, sulfa (comma separated)"
                  value={form.allergies} onChange={e => set("allergies", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Prescription Details */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">💊 Prescription Details</div>
                <div className="card-subtitle">Drug, dose, frequency and route</div>
              </div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Drug Name <span className="form-required">*</span></label>
                <select className="form-input form-select" required
                  value={form.drug} onChange={e => set("drug", e.target.value)}>
                  <option value="">Select a drug...</option>
                  {DRUGS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Dose Value <span className="form-required">*</span></label>
                  <input className="form-input" type="number" required min="0" step="any"
                    placeholder="e.g. 500" value={form.dose_value} onChange={e => set("dose_value", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit <span className="form-required">*</span></label>
                  <select className="form-input form-select" value={form.dose_unit} onChange={e => set("dose_unit", e.target.value as DoseUnit)}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Raw Dose Text <span className="form-hint" style={{ display: "inline", marginLeft: 4 }}>(as written on prescription)</span></label>
                <input className="form-input" placeholder="e.g. .5 mg or 5.0 mg"
                  value={form.dose_text_raw} onChange={e => set("dose_text_raw", e.target.value)} />
                <div className="form-hint">⚠ Decimal format errors (e.g. .5 or 5.0) will be flagged</div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Doses per Day</label>
                  <input className="form-input" type="number" min="0" step="1"
                    placeholder="e.g. 3 (blank if weekly)" value={form.frequency_per_day}
                    onChange={e => set("frequency_per_day", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Frequency Text <span className="form-required">*</span></label>
                  <input className="form-input" required placeholder="e.g. three times daily"
                    value={form.frequency_text} onChange={e => set("frequency_text", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">🔬 Administration Details</div>
                <div className="card-subtitle">Route, concentration (optional)</div>
              </div>
            </div>
            <div className="card-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Route of Administration</label>
                  <select className="form-input form-select" value={form.route} onChange={e => set("route", e.target.value)}>
                    {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Concentration (if applicable)</label>
                  <input className="form-input" placeholder="e.g. 10000 units/mL"
                    value={form.concentration} onChange={e => set("concentration", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Doctor's Note */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">📝 Doctor&apos;s Free-Text Note</div>
                <div className="card-subtitle">Gemma 4 will analyze this for contradictions and conflicts</div>
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                {form.note.length}/2000
              </div>
            </div>
            <div className="card-body">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <textarea
                  className="form-input form-textarea"
                  rows={6}
                  required
                  maxLength={2000}
                  placeholder="Enter the prescriber's instructions, clinical rationale, special directions... Gemma 4 will check this against structured fields for contradictions."
                  value={form.note}
                  onChange={e => set("note", e.target.value)}
                  style={{ minHeight: "140px" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginTop: "16px", padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "13px", color: "#991b1b", display: "flex", alignItems: "center", gap: "8px" }}>
            ❌ {error}
          </div>
        )}

        {/* Submit */}
        <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "12px", justifyContent: "flex-end" }}>
          <Link href="/dashboard" className="hms-btn-reset" style={{ textDecoration: "none", padding: "10px 20px" }}>Cancel</Link>
          <button
            type="submit"
            className="hms-btn-filter"
            disabled={!!phase}
            style={{ padding: "10px 28px", fontSize: "14px" }}
          >
            {phase
              ? <><span className="spinner spinner-white"></span> Processing Quality Gate...</>
              : "🚀 Submit & Run Quality Gate"}
          </button>
        </div>
      </form>
    </>
  );
}
