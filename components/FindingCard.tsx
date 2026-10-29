"use client";

import { useState } from "react";
import type { Finding, Decision } from "@/lib/schema";

interface FindingCardProps {
  finding: Finding;
  onResolve: (findingId: string, decision: Decision, reason: string) => Promise<void>;
  onStartCorrection?: (finding: Finding) => void;
  disabled?: boolean;
}

export default function FindingCard({ finding, onResolve, onStartCorrection, disabled = false }: FindingCardProps) {
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isResolved = Boolean(finding.resolution);

  const handleDecisionClick = (decision: Decision) => {
    setSelectedDecision(decision);
    setError(null);
    if (decision === "corrected" && onStartCorrection) onStartCorrection(finding);
  };

  const handleSubmit = async () => {
    if (!selectedDecision) { setError("Please select a decision."); return; }
    if (reason.trim().length < 5) { setError("Reason must be at least 5 characters."); return; }
    try {
      setSubmitting(true);
      setError(null);
      await onResolve(finding.id, selectedDecision, reason.trim());
      setSelectedDecision(null);
      setReason("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record resolution");
    } finally {
      setSubmitting(false);
    }
  };

  const severityBadge = finding.severity === "high" ? "badge-high" : finding.severity === "medium" ? "badge-medium" : "badge-low";

  return (
    <div className={`finding-card ${isResolved ? "resolved" : ""}`}>
      {/* Header */}
      <div className="finding-card-header">
        <div className="finding-card-badges">
          {finding.source === "gemma"
            ? <span className="source-tag-gemma">✦ Gemma AI</span>
            : <span className="source-tag-code">💻 Code</span>}
          <span className={`badge ${severityBadge}`}>{finding.severity}</span>
          {finding.field_involved && (
            <span style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", fontSize: "10.5px", padding: "2px 7px", borderRadius: "4px", fontWeight: 600 }}>
              {finding.field_involved}
            </span>
          )}
        </div>
        <span style={{ fontSize: "10.5px", fontFamily: "monospace", color: "var(--text-muted)", flexShrink: 0 }}>{finding.code}</span>
      </div>

      {/* Title */}
      <div className="finding-title">{finding.title}</div>

      {/* Evidence Box */}
      <div className="evidence-box">
        <div className="evidence-label">
          {finding.source === "code" ? "Calculated Evidence" : "Quoted Evidence (from Doctor's Note)"}
        </div>
        <div className="evidence-text">{finding.evidence}</div>
      </div>

      {/* English Explanation */}
      <div className="explanation-en">{finding.explanation_en}</div>

      {/* Urdu Explanation */}
      {finding.explanation_ur && (
        <div className="urdu-box">
          <div className="urdu-label" style={{ direction: "ltr", textAlign: "left" }}>اردو تفصیل</div>
          {finding.explanation_ur}
        </div>
      )}

      {/* Resolution */}
      {isResolved && finding.resolution ? (
        <div className="resolved-box">
          <span className="resolved-check">✓</span>
          <div>
            <div className="resolved-decision">Resolved: {finding.resolution.decision}</div>
            <div className="resolved-reason">{finding.resolution.reason}</div>
            <div className="resolved-meta">
              By {finding.resolution.by} · {new Date(finding.resolution.at).toLocaleString()}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "12px" }}>
          <div style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
            Pharmacist Action Required:
          </div>
          <div className="resolution-actions">
            <button
              type="button"
              disabled={disabled || submitting}
              onClick={() => handleDecisionClick("accepted")}
              className={`btn-accept ${selectedDecision === "accepted" ? "active" : ""}`}
              style={selectedDecision === "accepted" ? { outline: "2px solid #10b981", outlineOffset: "1px" } : {}}
            >
              ✓ Accept Risk
            </button>
            <button
              type="button"
              disabled={disabled || submitting}
              onClick={() => handleDecisionClick("corrected")}
              className={`btn-correct ${selectedDecision === "corrected" ? "active" : ""}`}
              style={selectedDecision === "corrected" ? { outline: "2px solid #f59e0b", outlineOffset: "1px" } : {}}
            >
              ✎ Correct Prescription
            </button>
            <button
              type="button"
              disabled={disabled || submitting}
              onClick={() => handleDecisionClick("escalated")}
              className={`btn-escalate ${selectedDecision === "escalated" ? "active" : ""}`}
              style={selectedDecision === "escalated" ? { outline: "2px solid #ef4444", outlineOffset: "1px" } : {}}
            >
              ↑ Escalate to Prescriber
            </button>
          </div>

          {selectedDecision && (
            <div className="reason-box">
              <div style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Clinical Reason <span style={{ color: "var(--danger)" }}>*</span>
              </div>
              <textarea
                className="form-textarea"
                rows={2}
                value={reason}
                onChange={e => setReason(e.target.value)}
                disabled={disabled || submitting}
                placeholder={
                  selectedDecision === "accepted"
                    ? "e.g. Benefit outweighs risk; specialist confirmed dose."
                    : selectedDecision === "corrected"
                    ? "e.g. Adjusted frequency from daily to once weekly as intended."
                    : "e.g. Contacted prescriber for clarification on extreme dosage."
                }
                style={{ width: "100%", border: "none", background: "transparent", outline: "none", resize: "none", fontFamily: "inherit", fontSize: "12.5px", lineHeight: 1.6 }}
              />
              <div className="reason-footer">
                <span className="char-count">{reason.trim().length}/5 min chars</span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSubmit}
                  disabled={disabled || submitting || reason.trim().length < 5}
                >
                  {submitting ? "Saving..." : "Confirm Decision"}
                </button>
              </div>
            </div>
          )}
          {error && <div className="form-error" style={{ marginTop: "8px" }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
