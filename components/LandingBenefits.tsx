"use client";

import React from "react";
import Link from "next/link";

const benefits = [
  {
    number: "01",
    title: "Deterministic Safety Hard-Stops.",
    description:
      "Hard-coded clinical rules enforce strict renal cutoffs (eGFR, CrCl), absolute contraindications, and maximum daily dose limits. Medical AI can never bypass or hallucinate around these gates.",
    metric: "100% Gate",
    metricLabel: "Hard-stop deterministic checks",
  },
  {
    number: "02",
    title: "Gemma 4 Clinical Reasoning.",
    description:
      "Gemma 4 synthesizes multi-drug interactions, patient age, weight, and clinical markers to classify severity and formulate alternative therapeutic interventions.",
    metric: "< 1.2s",
    metricLabel: "Real-time AI clinical analysis",
  },
  {
    number: "03",
    title: "Bilingual Urdu Patient Counseling.",
    description:
      "Translates complex pharmacology warnings into clear, empathetic Urdu instructions for patients and family caregivers to prevent post-discharge hospital readmissions.",
    metric: "نستعلیق",
    metricLabel: "Plain-language patient safety",
  },
  {
    number: "04",
    title: "Pharmacist Release Gate.",
    description:
      "Zero automated releases on flagged prescriptions. Every dispensation demands explicit pharmacist review (Accept, Correct, or Escalate) and cryptographic audit logging.",
    metric: "Human-in-Loop",
    metricLabel: "Mandatory licensed sign-off",
  },
];

export default function LandingBenefits() {
  return (
    <section id="clinical-safety" className="landing-benefits-section">
      {/* Background radial atmosphere */}
      <div className="benefits-glow-left" aria-hidden="true"></div>
      <div className="benefits-glow-right" aria-hidden="true"></div>

      <div className="landing-container">
        {/* Section Intro */}
        <div className="benefits-intro-grid">
          <div>
            <div className="benefits-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D68FD" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>POWERFUL CLINICAL GUARDRAILS</span>
            </div>

            <h2 className="benefits-heading">
              Every milligram counts.
              <span className="benefits-heading-highlight">
                Zero dispensing accidents.
              </span>
            </h2>
          </div>

          <p className="benefits-subtext">
            When medication orders enter the pharmacy, guessing is not a clinical protocol. DoseCheck inspects every parameter before the bottle is labeled or the blister pack is cut.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="benefits-cards-grid">
          {benefits.map((b) => (
            <article key={b.number} className="benefit-card">
              <div className="benefit-card-top">
                <span className="benefit-num">{b.number}</span>
                <div className="benefit-metric-pill">
                  <span className="metric-val">{b.metric}</span>
                  <span className="metric-lbl">{b.metricLabel}</span>
                </div>
              </div>

              <h3 className="benefit-card-title">{b.title}</h3>
              <p className="benefit-card-desc">{b.description}</p>

              <div className="benefit-card-footer">
                <span className="benefit-check-icon">✓</span>
                <span className="benefit-active-label">Active in DoseCheck Engine</span>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="benefits-banner-card">
          <div className="banner-card-content">
            <h3 className="banner-card-title">Ready to review live prescriptions in the Control Center?</h3>
            <p className="banner-card-sub">
              Access all active OPD dispensations, filter by controlled substances, and review Gemma 4 safety findings in real time.
            </p>
          </div>
          <Link href="/dashboard" className="landing-btn-primary" style={{ textDecoration: "none", flexShrink: 0 }}>
            <span>Open Safety Dashboard</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
