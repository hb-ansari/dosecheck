"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { AuditEntry } from "@/lib/schema";

const ACTION_STYLES: Record<string, { class: string; icon: string }> = {
  check_run:  { class: "source-tag-code", icon: "💻" },
  resolve:    { class: "badge badge-resolve", icon: "✓" },
  release:    { class: "badge badge-released", icon: "🚀" },
  default:    { class: "badge badge-pending", icon: "•" },
};

const DECISION_STYLES: Record<string, string> = {
  accepted:  "badge badge-resolve",
  corrected: "badge badge-correct",
  escalated: "badge badge-escalate",
};

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prescriptionFilter, setPrescriptionFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const loadAudit = useCallback(async (filter?: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = filter?.trim()
        ? `/api/audit?prescriptionId=${encodeURIComponent(filter.trim())}`
        : "/api/audit";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: AuditEntry[] = await res.json();
      setEntries(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudit();
  }, [loadAudit]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadAudit(prescriptionFilter);
  };

  // Counts
  const totalChecks = entries.filter((e) => e.action === "check_run").length;
  const totalResolve = entries.filter((e) => e.action === "resolve").length;
  const totalRelease = entries.filter((e) => e.action === "release").length;

  const filtered = entries.filter((e) =>
    actionFilter === "all" ? true : e.action === actionFilter
  );

  return (
    <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Audit Trail
          </h1>
          <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
            Tamper-resistant, append-only log of all check runs, clinical overrides, and dispensing releases
          </p>
        </div>
        <button className="hms-btn-reset" onClick={() => loadAudit(prescriptionFilter)}>
          ↻ Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="hms-metrics-row" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "20px" }}>
        <div className="hms-metric-card">
          <div className="hms-metric-header">
            <div className="hms-metric-icon" style={{ background: "#e0f2fe", color: "#2563eb" }}>💻</div>
            <span className="hms-metric-label">Check Runs</span>
          </div>
          <div>
            <div className="hms-metric-value">{totalChecks}</div>
            <div className="hms-metric-sub">Quality gate evaluations</div>
          </div>
        </div>

        <div className="hms-metric-card">
          <div className="hms-metric-header">
            <div className="hms-metric-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>✓</div>
            <span className="hms-metric-label">Resolutions</span>
          </div>
          <div>
            <div className="hms-metric-value">{totalResolve}</div>
            <div className="hms-metric-sub">Pharmacist decisions recorded</div>
          </div>
        </div>

        <div className="hms-metric-card">
          <div className="hms-metric-header">
            <div className="hms-metric-icon" style={{ background: "#f3e8ff", color: "#9333ea" }}>🚀</div>
            <span className="hms-metric-label">Releases</span>
          </div>
          <div>
            <div className="hms-metric-value">{totalRelease}</div>
            <div className="hms-metric-sub">Cleared for dispensing</div>
          </div>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="hms-table-container">
        <div className="hms-table-header-bar" style={{ flexWrap: "wrap", gap: "12px" }}>
          {/* Action Filter Tabs */}
          <div className="hms-tabs-bar" style={{ margin: 0, borderBottom: "none" }}>
            {[
              { key: "all", label: "All Actions" },
              { key: "check_run", label: "💻 Check Runs" },
              { key: "resolve", label: "✓ Resolutions" },
              { key: "release", label: "🚀 Releases" },
            ].map((t) => (
              <button
                key={t.key}
                className={`hms-tab-link ${actionFilter === t.key ? "active" : ""}`}
                onClick={() => setActionFilter(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Prescription filter */}
          <form onSubmit={handleFilter} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div className="hms-filter-item">
              <span>🔍</span>
              <input
                value={prescriptionFilter}
                onChange={(e) => setPrescriptionFilter(e.target.value)}
                placeholder="Filter by Prescription ID..."
                style={{ width: "200px" }}
              />
            </div>
            <button type="submit" className="hms-btn-filter" style={{ padding: "7px 14px" }}>
              Filter
            </button>
            {prescriptionFilter && (
              <button
                type="button"
                className="hms-btn-reset"
                onClick={() => {
                  setPrescriptionFilter("");
                  loadAudit("");
                }}
              >
                Clear
              </button>
            )}
          </form>
        </div>

        <div style={{ padding: "0 20px 8px" }}>
          <div style={{ padding: "12px 4px 8px", fontSize: "12px", color: "#64748b" }}>
            Showing {filtered.length} of {entries.length} entries
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ width: 24, height: 24, margin: "0 auto 12px" }}></div>
              <p>Loading audit entries...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <div className="empty-state-icon">❌</div>
              <div className="empty-state-title">Failed to load audit log</div>
              <div className="empty-state-text">{error}</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No audit records found</div>
              <div className="empty-state-text">Records will appear here once prescriptions are checked and processed.</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="hms-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Date & Time</th>
                    <th>Prescription ID</th>
                    <th>Source</th>
                    <th>Decision</th>
                    <th>Clinical Reason / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => {
                    const actionStyle = ACTION_STYLES[entry.action] || ACTION_STYLES.default;
                    return (
                      <tr key={entry.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%",
                              background: "#2D6A4F", color: "#ffffff",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "11px", fontWeight: 700, flexShrink: 0
                            }}>
                              {entry.by.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: "12.5px", fontWeight: 600 }}>{entry.by}</div>
                              <div style={{ fontSize: "10.5px", color: "#64748b" }}>Pharmacist</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={actionStyle.class} style={{ fontSize: "11.5px" }}>
                            {actionStyle.icon} {entry.action.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: "12.5px", fontWeight: 600 }}>
                            {new Date(entry.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                            {new Date(entry.at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </div>
                        </td>
                        <td>
                          <Link
                            href={`/review/${entry.prescriptionId}`}
                            style={{ fontSize: "11.5px", fontFamily: "monospace", color: "#2D6A4F", textDecoration: "underline", fontWeight: 600 }}
                          >
                            {entry.prescriptionId.slice(0, 8)}...
                          </Link>
                        </td>
                        <td>
                          {entry.source ? (
                            entry.source === "gemma"
                              ? <span className="source-tag-gemma">✦ Gemma</span>
                              : <span className="source-tag-code">💻 Code</span>
                          ) : <span style={{ color: "#94a3b8", fontSize: "12px" }}>-</span>}
                        </td>
                        <td>
                          {entry.decision ? (
                            <span className={DECISION_STYLES[entry.decision] || "badge badge-pending"}>
                              {entry.decision}
                            </span>
                          ) : <span style={{ color: "#94a3b8", fontSize: "12px" }}>-</span>}
                        </td>
                        <td style={{ maxWidth: "260px" }}>
                          <div style={{ fontSize: "12.5px", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {entry.reason || <span style={{ color: "#94a3b8" }}>-</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
