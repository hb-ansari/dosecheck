"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function TopBar() {
  const [reviewerName, setReviewerName] = useState("Ahmed Hassan");
  const [role] = useState("Licensed Pharmacist");
  const [now, setNow] = useState<Date | null>(null);
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const saved = localStorage.getItem("dosecheck_reviewer");
    if (saved?.trim()) {
      setReviewerName(saved.trim());
    } else {
      localStorage.setItem("dosecheck_reviewer", "Ahmed Hassan");
    }

    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNameChange = (val: string) => {
    setReviewerName(val);
    localStorage.setItem("dosecheck_reviewer", val);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase() || "AH";
  };

  const formattedDate = now
    ? now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Tue, Apr 22, 2025";

  const formattedTime = now
    ? now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "10:45 AM";

  return (
    <header className="hms-topbar">
      {/* Search Input */}
      <div className="hms-topbar-search">
        <svg className="hms-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search prescriptions, drugs, patients, interactions..."
          className="hms-search-input"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = (e.target as HTMLInputElement).value;
              if (val.trim()) {
                window.location.href = `/dashboard?search=${encodeURIComponent(val.trim())}`;
              }
            }
          }}
        />
        <span className="hms-search-kbd">Ctrl+K</span>
      </div>

      {/* Right Side: Status, Actions, User */}
      <div className="hms-topbar-right">
        {/* System Active Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", padding: "6px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <span className="hms-pulse-dot"></span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#166534" }}>DoseCheck Engine Active</span>
        </div>

        {/* Date Time Indicator */}
        <div className="hms-topbar-datetime">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>{formattedDate}</span>
          <span style={{ color: "#cbd5e1" }}>|</span>
          <span style={{ fontWeight: 600 }}>{formattedTime}</span>
        </div>

        {/* Quick Link to Landing Page */}
        <Link href="/landing" className="hms-btn-reset" style={{ fontSize: "12px", padding: "6px 12px", textDecoration: "none" }} title="View DoseCheck Landing Page & Simulator">
          ✨ Landing Page
        </Link>

        {/* User / Pharmacist Profile */}
        <div className="hms-user-profile">
          <div className="hms-avatar">{getInitials(reviewerName)}</div>
          <div className="hms-user-info">
            {editingName ? (
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                autoFocus
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  border: "1px solid #3b82f6",
                  borderRadius: "4px",
                  padding: "1px 4px",
                  width: "120px",
                }}
              />
            ) : (
              <div
                className="hms-user-name"
                onClick={() => setEditingName(true)}
                title="Click to edit Pharmacist name"
                style={{ cursor: "pointer" }}
              >
                {reviewerName}
                <span style={{ fontSize: "10px", marginLeft: "4px", color: "#94a3b8" }}>✎</span>
              </div>
            )}
            <div className="hms-user-role">{role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
