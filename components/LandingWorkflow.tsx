"use client";

import React from "react";
import Link from "next/link";

const steps = [
  {
    step: "01",
    tag: "INGESTION",
    title: "Order Entry & EHR Sync",
    desc: "Prescription parameters (drug, dose, frequency, labs, age, weight, allergies) ingested via FHIR / HL7 or barcode scan.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    step: "02",
    tag: "GUARDRAIL",
    title: "Deterministic Rule Engine",
    desc: "Instant hard-stop evaluation against renal cutoffs (eGFR < 30), max daily limits, and contraindicated drug-drug combinations.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  {
    step: "03",
    tag: "AI REASONING",
    title: "Gemma 4 Deep Review",
    desc: "Medical LLM contextualizes lab trends, drug kinetics, and patient-specific factors; generates actionable interventions and plain Urdu copy.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    step: "04",
    tag: "HUMAN-IN-LOOP",
    title: "Pharmacist Verification",
    desc: "Pharmacist on duty reviews clinical findings. Actions: Accept findings, Correct dosage, or Escalate to prescribing physician.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
  {
    step: "05",
    tag: "RELEASE",
    title: "Safe Dispensing & Audit Log",
    desc: "Barcoded release sticker printed with bilingual Urdu instructions. Timestamped pharmacist signature permanently archived in audit queue.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    ),
  },
];

export default function LandingWorkflow() {
  return (
    <section id="workflow" className="landing-workflow-section">
      <div className="landing-container">
        <div className="workflow-header">
          <div className="landing-eyebrow">
            <span className="landing-eyebrow-dot"></span>
            <span className="landing-eyebrow-text">5-STAGE QUALITY PIPELINE</span>
          </div>
          <h2 className="workflow-title">How DoseCheck Safeguards Every Dispensation</h2>
          <p className="workflow-sub">
            From the moment an electronic prescription arrives until the medication leaves the pharmacy counter, every dose passes through five verified stages.
          </p>
        </div>

        <div className="workflow-steps-grid">
          {steps.map((st) => (
            <div key={st.step} className="workflow-step-card">
              <div className="workflow-step-top">
                <span className="step-num-badge">{st.step}</span>
                <span className="step-tag">{st.tag}</span>
              </div>
              <div className="workflow-step-icon">{st.icon}</div>
              <h3 className="workflow-step-title">{st.title}</h3>
              <p className="workflow-step-desc">{st.desc}</p>
            </div>
          ))}
        </div>

        <div className="workflow-cta-strip">
          <div className="workflow-cta-text">
            <strong>See the 5 stages in action:</strong> Load demo cases with renal cutoffs and interaction flags.
          </div>
          <div className="workflow-cta-buttons">
            <Link href="/dashboard" className="landing-btn-primary" style={{ textDecoration: "none" }}>
              <span>View Control Center</span>
            </Link>
            <Link href="/audit" className="landing-btn-secondary" style={{ textDecoration: "none" }}>
              <span>Inspect Audit Queue</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
