"use client";

import { useState } from "react";
import type { GemmaMeta } from "@/lib/schema";

interface GemmaPanelProps {
  meta?: GemmaMeta;
}

export default function GemmaPanel({ meta }: GemmaPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!meta) return null;

  const isUnavailable = meta.status === "unavailable";
  const isInvalid = meta.status === "invalid_output";

  const statusStyle = isUnavailable
    ? { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }
    : isInvalid
    ? { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }
    : { background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" };

  return (
    <div className="gemma-panel">
      <button
        type="button"
        className="gemma-panel-header"
        onClick={() => setExpanded(!expanded)}
        style={{ width: "100%", textAlign: "left", border: "none", cursor: "pointer" }}
      >
        <div className="gemma-panel-title">
          <div style={{ width: 28, height: 28, borderRadius: "7px", background: "#eef2ff", border: "1px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800 }}>
            ✦
          </div>
          Gemma 4 Audit & Context Inspector
          <span style={{ ...statusStyle, fontSize: "10px", padding: "2px 7px", borderRadius: "9999px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {meta.status}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {!isUnavailable && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {meta.model} · {meta.latency_ms}ms
            </span>
          )}
          <span style={{ fontSize: "12px", color: "var(--brand)", fontWeight: 600 }}>
            {expanded ? "▲ Hide" : "▼ Inspect"}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="gemma-panel-body">
          <div className="gemma-stat-grid">
            <div className="gemma-stat">
              <div className="gemma-stat-label">Model ID</div>
              <div className="gemma-stat-value" style={{ fontSize: "11px" }}>{meta.model}</div>
            </div>
            <div className="gemma-stat">
              <div className="gemma-stat-label">Latency</div>
              <div className="gemma-stat-value">{meta.latency_ms} ms</div>
            </div>
            <div className="gemma-stat">
              <div className="gemma-stat-label">Status</div>
              <div className="gemma-stat-value">{meta.status}</div>
            </div>
            <div className="gemma-stat">
              <div className="gemma-stat-label">Dropped Unverified</div>
              <div className="gemma-stat-value" style={{ color: meta.dropped_unverified > 0 ? "#f59e0b" : "#10b981" }}>
                {meta.dropped_unverified} finding(s)
              </div>
            </div>
          </div>

          <div>
            <div className="gemma-json-label">
              Sanitized Input Sent to Gemma 4 (Zero PII) - JSON Payload:
            </div>
            <pre className="gemma-json">{JSON.stringify(meta.input_sent, null, 2)}</pre>
          </div>

          <div style={{ marginTop: "12px", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "6px", padding: "10px 12px", fontSize: "12px", color: "#5b21b6", lineHeight: 1.6 }}>
            <strong>Safety & Evidence Guard:</strong> Gemma 4 only evaluates clinical context and note contradictions. Any finding proposing an evidence quote that is not a verbatim substring of the input text is automatically discarded.
          </div>
        </div>
      )}
    </div>
  );
}
