import React from "react";
import type { Finding } from "@/lib/schema";

interface SummaryBarProps {
  findings: Finding[];
}

export default function SummaryBar({ findings }: SummaryBarProps) {
  const codeCount = findings.filter((f) => f.source === "code").length;
  const gemmaCount = findings.filter((f) => f.source === "gemma").length;
  const resolvedCount = findings.filter((f) => Boolean(f.resolution)).length;
  const total = findings.length;
  const allResolved = total > 0 && resolvedCount === total;
  const noneOpen = total === 0;

  return (
    <div className="summary-bar">
      <div className="summary-item">
        <span className="summary-dot summary-dot-code"></span>
        <span className="summary-value">{codeCount}</span>
        <span className="summary-label">Code Findings</span>
      </div>

      <div className="summary-divider"></div>

      <div className="summary-item">
        <span className="summary-dot summary-dot-gemma"></span>
        <span className="summary-value">{gemmaCount}</span>
        <span className="summary-label">Gemma AI Findings</span>
      </div>

      <div className="summary-divider"></div>

      <div className="summary-item">
        <span className="summary-dot summary-dot-resolved"></span>
        <span className="summary-value">{resolvedCount}</span>
        <span className="summary-label">of {total} Resolved</span>
      </div>

      <span className={`summary-status-tag ${noneOpen || allResolved ? "summary-clear" : "summary-open"}`}>
        {noneOpen
          ? "✓ Clean Prescription"
          : allResolved
          ? "✓ All Findings Resolved"
          : `⚠ ${total - resolvedCount} Open Finding${total - resolvedCount > 1 ? "s" : ""}`}
      </span>
    </div>
  );
}
