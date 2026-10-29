"use client";

import React from "react";
import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="landing-footer-section">
      <div className="landing-container">
        <div className="footer-top-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <div className="footer-brand">
              <div className="notch-logo-box" style={{ width: "32px", height: "32px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111116" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <span className="footer-brand-name">DoseCheck</span>
            </div>
            <p className="footer-brand-tagline">
              Pre-dispensing clinical quality gate combining deterministic rule guardrails with Gemma 4 deep reasoning and automated Urdu patient counseling.
            </p>
            <div className="footer-compliance-pill">
              <span className="compliance-dot"></span>
              <span>Clinical Decision Support System (CDSS) - Pharmacist Sign-Off Mandatory</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-links-list">
              <li><Link href="/">Home Overview</Link></li>
              <li><a href="#clinical-safety">Clinical Safety Rules</a></li>
              <li><a href="#simulator">Interactive Simulator</a></li>
              <li><a href="#workflow">5-Stage Pipeline</a></li>
              <li><Link href="/dashboard">Safety Dashboard</Link></li>
            </ul>
          </div>

          {/* Operations Column */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Operations</h4>
            <ul className="footer-links-list">
              <li><Link href="/dashboard">Control Center Table</Link></li>
              <li><Link href="/new">+ Add Prescription</Link></li>
              <li><Link href="/audit">Audit Queue & Logs</Link></li>
              <li><Link href="/review/939afbc2-56ce-4ba3-bfef-6d44e47c2ee6">Sample Clinical Review</Link></li>
            </ul>
          </div>

          {/* Standards Column */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Clinical Standards</h4>
            <ul className="footer-links-list">
              <li><span>Renal: Cockcroft-Gault & CKD-EPI</span></li>
              <li><span>Dosing: BNF / FDA / ASHP</span></li>
              <li><span>AI Engine: Gemma 4 Med</span></li>
              <li><span>Language: Noto Nastaliq Urdu</span></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-copy">
            © 2025-2026 DoseCheck System. Pre-Dispensing Quality Gate. Zero dispensing accidents.
          </div>
          <div className="footer-status-tag">
            <span className="footer-pulse-dot"></span>
            <span>All Engines Operational (Deterministic + Gemma 4)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
