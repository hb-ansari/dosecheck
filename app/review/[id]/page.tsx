"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import type { Prescription, Finding, Decision, DoseUnit } from "@/lib/schema";
import FindingCard from "@/components/FindingCard";
import EvidenceNote from "@/components/EvidenceNote";
import SummaryBar from "@/components/SummaryBar";
import GemmaPanel from "@/components/GemmaPanel";
import ReleaseButton from "@/components/ReleaseButton";

const UNITS: DoseUnit[] = ["mg", "mcg", "g", "units"];

export default function ClinicalReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const prescriptionId = resolvedParams.id;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewerName, setReviewerName] = useState("Ahmed Hassan");
  const [selectedGemmaQuote, setSelectedGemmaQuote] = useState<string | undefined>(undefined);

  // Correction inline state
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [corrDoseValue, setCorrDoseValue] = useState<number>(0);
  const [corrDoseUnit, setCorrDoseUnit] = useState<DoseUnit>("mg");
  const [corrDoseRaw, setCorrDoseRaw] = useState<string>("");
  const [corrFreqPerDay, setCorrFreqPerDay] = useState<number | null>(null);
  const [corrFreqText, setCorrFreqText] = useState<string>("");
  const [rechecking, setRechecking] = useState(false);
  const [recheckError, setRecheckError] = useState<string | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("dosecheck_reviewer");
    if (savedName?.trim()) setReviewerName(savedName.trim());
  }, []);

  const loadPrescription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/prescriptions/${prescriptionId}`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? "Prescription not found." : `Failed to load prescription (${res.status})`);
      }
      const data: Prescription = await res.json();
      setPrescription(data);

      const firstGemma = data.findings?.find((f) => f.source === "gemma" && f.evidence);
      if (firstGemma) setSelectedGemmaQuote(firstGemma.evidence);

      setCorrDoseValue(data.dose_value);
      setCorrDoseUnit(data.dose_unit);
      setCorrDoseRaw(data.dose_text_raw);
      setCorrFreqPerDay(data.frequency_per_day);
      setCorrFreqText(data.frequency_text);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading prescription.");
    } finally {
      setLoading(false);
    }
  }, [prescriptionId]);

  useEffect(() => {
    loadPrescription();
  }, [loadPrescription]);

  const handleResolve = async (findingId: string, decision: Decision, reason: string) => {
    const res = await fetch("/api/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ findingId, decision, reason, by: reviewerName || "Ahmed Hassan" }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Resolution failed (${res.status})`);
    }
    await loadPrescription();
  };

  const handleRunRecheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescription) return;
    try {
      setRechecking(true);
      setRecheckError(null);
      const payload = {
        id: prescription.id,
        by: reviewerName || "Ahmed Hassan",
        patient: prescription.patient,
        drug: prescription.drug,
        dose_value: Number(corrDoseValue),
        dose_unit: corrDoseUnit,
        dose_text_raw: corrDoseRaw.trim() || `${corrDoseValue} ${corrDoseUnit}`,
        frequency_per_day: corrFreqPerDay !== null ? Number(corrFreqPerDay) : null,
        frequency_text: corrFreqText.trim(),
        concentration: prescription.concentration,
        route: prescription.route,
        note: prescription.note,
      };
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Recheck failed (${res.status})`);
      }
      setIsCorrecting(false);
      await loadPrescription();
    } catch (err: unknown) {
      setRecheckError(err instanceof Error ? err.message : "Failed to re-run checks.");
    } finally {
      setRechecking(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state" style={{ paddingTop: "80px" }}>
        <div className="spinner" style={{ width: 28, height: 28, margin: "0 auto 12px" }}></div>
        <p>Loading clinical medication profile & safety checks...</p>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="empty-state" style={{ paddingTop: "80px" }}>
        <div className="empty-state-icon">❌</div>
        <div className="empty-state-title">Error Loading Prescription</div>
        <div className="empty-state-text" style={{ marginBottom: "20px" }}>{error || "Prescription not found."}</div>
        <Link href="/dashboard" className="hms-btn-filter" style={{ textDecoration: "none", display: "inline-block" }}>
          ← Return to Safety Dashboard
        </Link>
      </div>
    );
  }

  const isReleased = prescription.status === "released";
  const statusClass =
    prescription.status === "released"
      ? "approved"
      : prescription.status === "flagged"
      ? "flagged"
      : "pending";

  return (
    <div className="clinical-layout" style={{ maxWidth: "1600px", margin: "0 auto" }}>
      {/* ─── TOP CLINICAL BAR (IMAGE 2 HEADER MATCH) ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/dashboard" style={{ color: "#64748b", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Safety Dashboard
          </Link>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Clinical Medication Review
          </h1>
          <span className={`hms-status-badge ${statusClass}`}>
            <span className="hms-status-dot"></span>
            {prescription.status.toUpperCase()}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="hms-btn-reset" onClick={loadPrescription} style={{ fontSize: "12px", padding: "6px 12px" }}>
            ↻ Refresh
          </button>
          <button className="hms-btn-reset" style={{ fontSize: "12px", padding: "6px 12px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
          <ReleaseButton
            prescriptionId={prescription.id}
            status={prescription.status}
            findings={prescription.findings}
            reviewerName={reviewerName}
            onReleased={loadPrescription}
          />
        </div>
      </div>

      {/* ─── HERO CLINICAL BANNER (IMAGE 2 MATCH) ─── */}
      <div className="clinical-hero-card">
        <div className="clinical-hero-content">
          <div className="clinical-hero-tag">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z"/>
              <line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/>
            </svg>
            <span style={{ textTransform: "capitalize", fontWeight: 700 }}>{prescription.drug}</span>
            <span>·</span>
            <span>{prescription.dose_value} {prescription.dose_unit} ({prescription.frequency_text})</span>
          </div>

          <div className="clinical-hero-title">
            Clinical Quality Gate Active
          </div>

          {/* Stepper Timeline */}
          <div className="clinical-stepper">
            <div className="clinical-step">
              <span className="clinical-step-dot"></span>
              <span className="clinical-step-text">0.25mg · Wk 1-4</span>
            </div>
            <div className="clinical-step active">
              <span className="clinical-step-dot"></span>
              <span className="clinical-step-text">
                {prescription.dose_value}{prescription.dose_unit} · Now Current
              </span>
            </div>
            <div className="clinical-step">
              <span className="clinical-step-dot"></span>
              <span className="clinical-step-text">Titration Wk 9-12</span>
            </div>
            <div className="clinical-step">
              <span className="clinical-step-dot"></span>
              <span className="clinical-step-text">Maintenance</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right", zIndex: 2 }}>
          <div className="clinical-hero-rx-badge" style={{ marginBottom: "12px" }}>
            Rx: Dr. Chen (Hospital MD)
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.8)" }}>
            Route: <strong>{prescription.route || "Oral"}</strong> · Age: <strong>{prescription.patient.age_years}y</strong>
            {prescription.patient.weight_kg ? ` · ${prescription.patient.weight_kg}kg` : ""}
          </div>
        </div>
      </div>

      {/* ─── SUMMARY STATUS BAR ─── */}
      <SummaryBar findings={prescription.findings} />

      {/* ─── CLINICAL 3-CARD ROW (IMAGE 2 MATCH) ─── */}
      <div className="clinical-grid">
        {/* Card 1: Drug Concentration / Pharmacokinetics Level Card */}
        <div className="clinical-card">
          <div className="clinical-card-header">
            <div className="clinical-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Serum Concentration Level</span>
            </div>
            <span className="clinical-badge-pill">Peak now</span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a" }}>97%</span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>estimated bioavailability</span>
          </div>
          <div style={{ fontSize: "11px", color: "#0284c7", fontWeight: 600, marginTop: "2px" }}>
            Dose administered today
          </div>

          {/* SVG Smooth Curve */}
          <div className="curve-chart-wrapper">
            <svg className="curve-chart-svg" viewBox="0 0 300 80" fill="none">
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 10 20 Q 70 25 150 50 T 290 65 L 290 80 L 10 80 Z"
                fill="url(#curveGradient)"
              />
              <path
                d="M 10 20 Q 70 25 150 50 T 290 65"
                stroke="#0284c7"
                strokeWidth="3"
                fill="none"
              />
              <circle cx="10" cy="20" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>

          <div className="curve-chart-meta">
            <div className="curve-meta-box">
              <span className="curve-meta-label">Peak</span>
              <span className="curve-meta-val green">Day 1-2 Optimal</span>
            </div>
            <div className="curve-meta-box" style={{ textAlign: "right" }}>
              <span className="curve-meta-label">Trough</span>
              <span className="curve-meta-val orange">Day 6-7 Clearance</span>
            </div>
          </div>
        </div>

        {/* Card 2: Clinical Effectiveness & Labs */}
        <div className="clinical-card">
          <div className="clinical-card-header">
            <div className="clinical-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>Effectiveness & Patient Labs</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <line x1="7" y1="17" x2="17" y2="7"/>
              <polyline points="7 7 17 7 17 17"/>
            </svg>
          </div>

          <div className="effectiveness-row">
            <div className="effectiveness-meta">
              <span className="effectiveness-name">Patient Weight</span>
              <span className="effectiveness-val">
                {prescription.patient.weight_kg ? `↓ 3.2 kg (${prescription.patient.weight_kg} kg)` : "Not recorded"}
              </span>
            </div>
            <div className="effectiveness-bar">
              <div className="effectiveness-fill" style={{ width: "70%" }}></div>
            </div>
          </div>

          <div className="effectiveness-row">
            <div className="effectiveness-meta">
              <span className="effectiveness-name">HbA1c / Glycemic</span>
              <span className="effectiveness-val">↓ 0.3% · 5.4%</span>
            </div>
            <div className="effectiveness-bar">
              <div className="effectiveness-fill" style={{ width: "55%", background: "#0284c7" }}></div>
            </div>
          </div>

          <div className="effectiveness-row">
            <div className="effectiveness-meta">
              <span className="effectiveness-name">Renal Clearance / Condition</span>
              <span className="effectiveness-val">{prescription.patient.condition || "Normal eGFR"}</span>
            </div>
            <div className="effectiveness-bar">
              <div className="effectiveness-fill" style={{ width: "85%", background: "#10b981" }}></div>
            </div>
          </div>

          <div className="effectiveness-row" style={{ marginBottom: 0 }}>
            <div className="effectiveness-meta">
              <span className="effectiveness-name">Known Allergies</span>
              <span className="effectiveness-val" style={{ color: prescription.patient.allergies?.length ? "#ef4444" : "#10b981" }}>
                {prescription.patient.allergies?.length ? prescription.patient.allergies.join(", ") : "None reported"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Side Effect / Safety Tracker */}
        <div className="clinical-card">
          <div className="clinical-card-header">
            <div className="clinical-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>Side Effect & Adverse Events</span>
            </div>
            <button className="hms-btn-reset" style={{ fontSize: "11px", padding: "3px 8px" }}>
              + Log
            </button>
          </div>

          <div className="side-effect-item">
            <div className="side-effect-info">
              <span>😐</span>
              <div>
                <div className="side-effect-name">Mild nausea</div>
                <div className="side-effect-sub">Reported during dose initiation</div>
              </div>
            </div>
            <span className="side-effect-status">Resolved</span>
          </div>

          <div className="side-effect-item">
            <div className="side-effect-info">
              <span>⚡</span>
              <div>
                <div className="side-effect-name">Fatigue / Sedation</div>
                <div className="side-effect-sub">2h post-administration</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "3px" }}>
              <span style={{ color: "#ea580c" }}>●●</span>
              <span style={{ color: "#e2e8f0" }}>○○○</span>
            </div>
          </div>

          <div className="side-effect-item" style={{ borderBottom: "none" }}>
            <div className="side-effect-info">
              <span>🩺</span>
              <div>
                <div className="side-effect-name">Gastrointestinal Tolerance</div>
                <div className="side-effect-sub">Clinical tolerance monitored</div>
              </div>
            </div>
            <span className="side-effect-status" style={{ background: "#ecfdf5", color: "#059669" }}>Clear</span>
          </div>
        </div>
      </div>

      {/* ─── DOSECHECK CORE SAFETY AUDIT & FINDINGS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "20px", alignItems: "start", marginTop: "10px" }}>
        {/* Left Column: Doctor Note & Prescription Correction */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Doctor's Note with Evidence Highlighting */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📝 Doctor&apos;s Prescription Note</div>
              {selectedGemmaQuote && (
                <span style={{ fontSize: "11px", color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: "9999px", fontWeight: 600 }}>
                  ✦ Gemma cited
                </span>
              )}
            </div>
            <div className="card-body">
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", fontSize: "13px", lineHeight: "1.7" }}>
                <EvidenceNote text={prescription.note} quote={selectedGemmaQuote} />
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>
                Quotes highlighted above are verbatim text cited by Gemma 4. Click any finding to isolate its evidence.
              </div>
            </div>

            {/* Inline Correction Form */}
            {!isReleased && (
              <div style={{ borderTop: "1px solid #f1f5f9", padding: "12px 16px" }}>
                {!isCorrecting ? (
                  <button
                    className="hms-btn-reset"
                    style={{ width: "100%", justifyContent: "center", color: "#92400e", borderColor: "#fde68a", background: "#fffbeb" }}
                    onClick={() => { setIsCorrecting(true); setRecheckError(null); }}
                  >
                    ✎ Correct Dose / Frequency & Re-run Checks
                  </button>
                ) : (
                  <form onSubmit={handleRunRecheck} className="correction-form">
                    <div className="correction-form-title">
                      <span>✎ Correct Prescription Fields</span>
                      <button type="button" onClick={() => setIsCorrecting(false)} className="hms-btn-reset" style={{ padding: "2px 6px", fontSize: "11px" }}>✕ Cancel</button>
                    </div>
                    <div className="form-grid-2" style={{ gap: "10px", marginBottom: "10px" }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Dose Value</label>
                        <input type="number" step="any" required className="form-input"
                          value={corrDoseValue} onChange={e => setCorrDoseValue(parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Unit</label>
                        <select className="form-input form-select" value={corrDoseUnit} onChange={e => setCorrDoseUnit(e.target.value as DoseUnit)}>
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Doses/Day</label>
                        <input type="number" className="form-input"
                          value={corrFreqPerDay ?? ""} onChange={e => setCorrFreqPerDay(e.target.value === "" ? null : parseInt(e.target.value, 10))}
                          placeholder="e.g. 3" />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Frequency Text</label>
                        <input type="text" required className="form-input"
                          value={corrFreqText} onChange={e => setCorrFreqText(e.target.value)}
                          placeholder="e.g. once daily" />
                      </div>
                    </div>
                    {recheckError && <div className="form-error" style={{ marginBottom: "8px" }}>{recheckError}</div>}
                    <button type="submit" disabled={rechecking} className="hms-btn-filter" style={{ width: "100%", justifyContent: "center" }}>
                      {rechecking ? <><span className="spinner spinner-white"></span> Re-evaluating...</> : "Save & Re-run Quality Gate"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Gemma 4 AI Deep Metadata Panel */}
          <GemmaPanel meta={prescription.gemmaMeta} />
        </div>

        {/* Right Column: Findings & Resolutions */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                Pharmacist Quality Gate Findings
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748b", marginLeft: "8px" }}>
                  ({prescription.findings.length})
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Deterministic Code Rules + Gemma 4 AI Contextual Validation with Urdu Explanations
              </div>
            </div>
            {prescription.findings.length > 0 && (
              <div style={{ display: "flex", gap: "8px" }}>
                <span className="source-tag-code">
                  💻 {prescription.findings.filter(f => f.source === "code").length} Code
                </span>
                <span className="source-tag-gemma">
                  ✦ {prescription.findings.filter(f => f.source === "gemma").length} Gemma AI
                </span>
              </div>
            )}
          </div>

          {prescription.findings.length === 0 ? (
            <div className="card">
              <div style={{ textAlign: "center", padding: "48px 24px" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>✅</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>
                  All Safety & Context Checks Cleared
                </div>
                <div style={{ fontSize: "13px", color: "#64748b", maxWidth: "420px", margin: "0 auto 20px" }}>
                  Zero safety rule flags and zero Gemma AI contradictions detected. This prescription is cleared for immediate dispensing.
                </div>
                <ReleaseButton
                  prescriptionId={prescription.id}
                  status={prescription.status}
                  findings={prescription.findings}
                  reviewerName={reviewerName}
                  onReleased={loadPrescription}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {prescription.findings.map((f) => (
                <div
                  key={f.id}
                  onClick={() => { if (f.source === "gemma" && f.evidence) setSelectedGemmaQuote(f.evidence); }}
                  style={{ cursor: f.source === "gemma" && f.evidence ? "pointer" : "default" }}
                >
                  <FindingCard
                    finding={f}
                    onResolve={handleResolve}
                    onStartCorrection={() => { setIsCorrecting(true); setRecheckError(null); }}
                    disabled={isReleased}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
