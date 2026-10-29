"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Header() {
  const [reviewerName, setReviewerName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("dosecheck_reviewer") ?? "";
    setReviewerName(stored);
  }, []);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setReviewerName(val);
    localStorage.setItem("dosecheck_reviewer", val);
  }

  return (
    <header
      style={{
        background: "rgba(10,15,30,0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1.5rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              flexShrink: 0,
            }}
          >
            ⚕
          </div>
          <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#f1f5f9", letterSpacing: "-0.02em" }}>
            DoseCheck
          </span>
        </Link>

        {/* Center badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          <span
            style={{
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.35)",
              color: "#c4b5fd",
              fontSize: "0.7rem",
              fontWeight: "700",
              padding: "0.2rem 0.6rem",
              borderRadius: "20px",
              letterSpacing: "0.03em",
            }}
          >
            ✦ Powered by Gemma 4 · Apache 2.0
          </span>
          <span
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#f87171",
              fontSize: "0.65rem",
              fontWeight: "600",
              padding: "0.2rem 0.5rem",
              borderRadius: "20px",
            }}
          >
            Decision-support prototype · Synthetic data only
          </span>
        </div>

        {/* Nav + Reviewer name */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <nav style={{ display: "flex", gap: "0.25rem" }}>
            {[
              { href: "/dashboard", label: "Queue" },
              { href: "/new", label: "New Rx" },
              { href: "/audit", label: "Audit" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  color: "#94a3b8",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "6px",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = "#f1f5f9";
                  (e.target as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = "#94a3b8";
                  (e.target as HTMLElement).style.background = "transparent";
                }}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>Reviewing as:</span>
            <input
              id="reviewer-name"
              type="text"
              value={reviewerName}
              onChange={handleNameChange}
              placeholder="Your name"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                color: "#f1f5f9",
                padding: "0.3rem 0.6rem",
                fontSize: "0.8rem",
                width: "120px",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
