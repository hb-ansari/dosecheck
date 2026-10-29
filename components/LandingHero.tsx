"use client";

import React, { useState } from "react";
import Link from "next/link";

interface ClinicalScenario {
  id: string;
  drug: string;
  dose: string;
  patient: string;
  status: "flagged" | "safe";
  riskScore: string;
  deterministicRule: string;
  aiReasoning: string;
  urduExplanation: string;
  recommendation: string;
}

const scenarios: ClinicalScenario[] = [
  {
    id: "sc-1",
    drug: "Metformin 1000mg BID",
    dose: "1000mg PO Twice Daily",
    patient: "Male, 68y | eGFR 22 mL/min (CKD Stage 4)",
    status: "flagged",
    riskScore: "HIGH RISK (98%)",
    deterministicRule: "DC-REN-04: Metformin is strictly contraindicated at eGFR < 30 mL/min due to fatal lactic acidosis risk.",
    aiReasoning: "Severe renal failure impairs metformin clearance exponentially. Risk of life-threatening metformin-associated lactic acidosis (MALA) is elevated. Stop immediately.",
    urduExplanation: "گردوں کی شدید کمزوری (eGFR 22) کی وجہ سے میٹفارمین خون میں زہریلی تیزابیت پیدا کر سکتی ہے جو جان لیوا ہو سکتی ہے۔ یہ دوا فوری روک کر ڈاکٹر سے تبدیل کروائیں۔",
    recommendation: "Hold Metformin. Switch to DPP-4 inhibitor (Linagliptin 5mg once daily, requiring no renal adjustment).",
  },
  {
    id: "sc-2",
    drug: "Warfarin 5mg + Ciprofloxacin 500mg",
    dose: "Warfarin 5mg Daily + Cipro 500mg BID",
    patient: "Female, 72y | Atrial Fibrillation + UTI",
    status: "flagged",
    riskScore: "CRITICAL INTERACTION (95%)",
    deterministicRule: "DC-DDI-12: Ciprofloxacin potent CYP1A2 / CYP3A4 inhibition increases Warfarin bioavailability and INR.",
    aiReasoning: "Co-administration induces severe coagulopathy and major gastrointestinal or intracranial hemorrhage. Immediate intervention required.",
    urduExplanation: "وارفرین اور سپرو دونوں ایک ساتھ لینے سے خون بہت زیادہ پتلا ہو جاتا ہے جس سے اندرونی خون بہنے کا شدید خطرہ ہوتا ہے۔ سپرو کے متبادل اینٹی بائیوٹک لیں۔",
    recommendation: "Hold Ciprofloxacin. Substitute with Cephalexin 500mg or adjust Warfarin dose with daily INR monitoring.",
  },
  {
    id: "sc-3",
    drug: "Amoxicillin 500mg TDS",
    dose: "500mg PO Every 8 Hours x 7 Days",
    patient: "Female, 34y | eGFR > 90 mL/min | No Allergies",
    status: "safe",
    riskScore: "CLEARED & SAFE (100%)",
    deterministicRule: "DC-DOS-01: Dose within FDA & BNF recommended adult range (1500mg/day <= 3000mg/day max).",
    aiReasoning: "No drug-drug interactions, renal function is optimal, no penicillin allergy reported in EHR. Approved for safe dispensation.",
    urduExplanation: "یہ خوراک مریض کے وزن اور گردوں کے معیار کے عین مطابق ہے۔ کوئی مضر اثر یا تضاد نہیں پایا گیا۔ دوا جاری رکھی جا سکتی ہے۔",
    recommendation: "Approved for immediate release. Advise patient to complete full 7-day course.",
  },
];

export default function LandingHero() {
  const [activeScenario, setActiveScenario] = useState<ClinicalScenario>(scenarios[0]);

  return (
    <section className="landing-hero-section">
      {/* Background ambient lighting and grid */}
      <div className="landing-ambient-glow" aria-hidden="true"></div>
      <div className="landing-ambient-glow-bottom" aria-hidden="true"></div>

      <div className="landing-container">
        {/* Eyebrow Badge */}
        <div className="landing-eyebrow-wrapper">
          <div className="landing-eyebrow">
            <span className="landing-eyebrow-dot"></span>
            <span className="landing-eyebrow-text">DOSECHECK CLINICAL QUALITY GATE</span>
            <span className="landing-eyebrow-pill">Gemma 4 AI + Rule Engine</span>
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="landing-main-title">
          Every dose verified.
          <span className="landing-title-highlight">
            Catch fatal errors before dispensing.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="landing-subtitle">
          DoseCheck bridges deterministic clinical guardrails (renal cutoffs, max daily limits, contraindications)
          with Gemma 4 deep reasoning and automated Urdu patient counseling. Zero dispensing accidents, guaranteed.
        </p>

        {/* Primary CTA Buttons */}
        <div className="landing-cta-row">
          <Link href="/dashboard" className="landing-btn-primary" style={{ textDecoration: "none" }}>
            <span>Launch Control Center</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>

          <a href="#simulator" className="landing-btn-secondary" style={{ textDecoration: "none" }}>
            <span>Interactive Simulator</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </a>

          <Link href="/new" className="landing-btn-ghost" style={{ textDecoration: "none" }}>
            <span>+ Scan New Rx</span>
          </Link>
        </div>

        {/* Key Metrics Strip */}
        <div className="landing-metric-strip">
          <div className="landing-strip-item">
            <div className="strip-item-num">100%</div>
            <div className="strip-item-label">Deterministic Hard-Stops</div>
          </div>
          <div className="landing-strip-divider"></div>
          <div className="landing-strip-item">
            <div className="strip-item-num">&lt; 1.2s</div>
            <div className="strip-item-label">Dual Engine Latency</div>
          </div>
          <div className="landing-strip-divider"></div>
          <div className="landing-strip-item">
            <div className="strip-item-num">Bilingual</div>
            <div className="strip-item-label">Urdu + English Counseling</div>
          </div>
          <div className="landing-strip-divider"></div>
          <div className="landing-strip-item">
            <div className="strip-item-num">Zero Risk</div>
            <div className="strip-item-label">Mandatory Pharmacist Gate</div>
          </div>
        </div>

        {/* ─── LIVE INTERACTIVE CLINICAL SIMULATOR CARD ─── */}
        <div id="simulator" className="landing-simulator-card">
          <div className="simulator-header">
            <div className="simulator-header-left">
              <div className="simulator-indicator">
                <span className="simulator-pulse"></span>
                <span>LIVE QUALITY GATE SIMULATOR</span>
              </div>
              <h2 className="simulator-title">Test Pre-Dispensing Clinical Scenarios</h2>
            </div>
            <div className="simulator-tabs">
              {scenarios.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setActiveScenario(sc)}
                  className={`simulator-tab-btn ${activeScenario.id === sc.id ? "active" : ""}`}
                >
                  {sc.drug.split(" ")[0]} Case
                </button>
              ))}
            </div>
          </div>

          <div className="simulator-body">
            {/* Left Column: Prescription & Patient Details */}
            <div className="simulator-col simulator-rx-col">
              <div className="sim-rx-box">
                <div className="sim-field-label">PRESCRIPTION DETAILS</div>
                <div className="sim-drug-name">{activeScenario.drug}</div>
                <div className="sim-dose-text">{activeScenario.dose}</div>
                <div className="sim-patient-meta">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>{activeScenario.patient}</span>
                </div>
              </div>

              {/* Status Pill */}
              <div className="sim-status-box">
                <div className="sim-field-label">SAFETY GATE VERDICT</div>
                <div className={`sim-verdict-pill ${activeScenario.status}`}>
                  <span className="sim-verdict-icon">
                    {activeScenario.status === "flagged" ? "⚠️" : "✓"}
                  </span>
                  <span>{activeScenario.riskScore}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Dual Engine Findings */}
            <div className="simulator-col simulator-findings-col">
              {/* Layer 1: Deterministic Rule */}
              <div className="sim-finding-box rule-box">
                <div className="sim-box-tag rule-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>LAYER 1: DETERMINISTIC HARD-STOP RULE</span>
                </div>
                <div className="sim-box-content">{activeScenario.deterministicRule}</div>
              </div>

              {/* Layer 2: Gemma 4 Clinical AI Reasoning */}
              <div className="sim-finding-box ai-box">
                <div className="sim-box-tag ai-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  <span>LAYER 2: GEMMA 4 CLINICAL REASONING</span>
                </div>
                <div className="sim-box-content">{activeScenario.aiReasoning}</div>
                <div className="sim-recommendation">
                  <strong>Recommendation:</strong> {activeScenario.recommendation}
                </div>
              </div>

              {/* Layer 3: Patient Urdu Counseling Box */}
              <div className="sim-finding-box urdu-box">
                <div className="sim-box-tag urdu-tag">
                  <span>اردو ہدایات (URDU PATIENT COUNSELING)</span>
                </div>
                <div className="sim-urdu-content" dir="rtl">
                  {activeScenario.urduExplanation}
                </div>
              </div>
            </div>
          </div>

          {/* Simulator Footer CTA */}
          <div className="simulator-footer">
            <span className="sim-footer-note">
              Deterministic rules cannot be overridden by AI. All releases require licensed pharmacist digital signature.
            </span>
            <Link href="/dashboard" className="sim-footer-link">
              <span>View Full Control Center Table</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
