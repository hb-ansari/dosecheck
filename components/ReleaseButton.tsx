"use client";

import { useState } from "react";
import type { Finding } from "@/lib/schema";

interface ReleaseButtonProps {
  prescriptionId: string;
  status: "pending" | "flagged" | "released";
  findings: Finding[];
  reviewerName: string;
  onReleased: () => void;
}

export default function ReleaseButton({ prescriptionId, status, findings, reviewerName, onReleased }: ReleaseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReleased = status === "released";
  const unresolvedFindings = findings.filter((f) => !f.resolution);
  const hasUnresolved = unresolvedFindings.length > 0;
  const canRelease = !isReleased && !hasUnresolved;

  const tooltipText = isReleased
    ? "Prescription has already been released."
    : hasUnresolved
    ? `Cannot release: ${unresolvedFindings.length} open finding(s) must be resolved first.`
    : !reviewerName.trim()
    ? "Reviewer name is required to release."
    : "All quality checks cleared. Click to release for dispensing.";

  const handleRelease = async () => {
    if (!canRelease) return;
    if (!reviewerName.trim()) { setError("Please set a reviewer name before releasing."); return; }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescriptionId, by: reviewerName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Release failed (${res.status})`);
      }
      onReleased();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to release prescription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
      <div className="release-btn-wrapper">
        <button
          type="button"
          disabled={!canRelease || loading}
          onClick={handleRelease}
          className={isReleased ? "btn btn-outline" : canRelease ? "btn btn-success" : "btn btn-outline"}
          style={
            isReleased
              ? { color: "#065f46", background: "#ecfdf5", borderColor: "#a7f3d0", cursor: "default" }
              : !canRelease
              ? { opacity: 0.5, cursor: "not-allowed" }
              : {}
          }
        >
          {isReleased ? (
            <><span>✓</span> Released for Dispensing</>
          ) : loading ? (
            <><span className="spinner spinner-white"></span> Releasing...</>
          ) : (
            <><span>🛡️</span> Sign & Release</>
          )}
        </button>
        {!isReleased && <div className="release-tooltip">{tooltipText}</div>}
      </div>

      {error && (
        <div style={{ fontSize: "11.5px", color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", padding: "4px 10px", borderRadius: "6px", maxWidth: "260px", textAlign: "right" }}>
          {error}
        </div>
      )}
    </div>
  );
}
