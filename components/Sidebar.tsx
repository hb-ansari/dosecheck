"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "Landing Page",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/dashboard",
    label: "Safety Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    ),
  },
  {
    href: "/new",
    label: "+ New Prescription",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
  {
    href: "/audit",
    label: "Audit Queue",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    href: "/dashboard?tab=Approvals",
    label: "Flagged Interventions",
    badge: 5,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    href: "/dashboard?tab=Controlled+Drugs",
    label: "Controlled Drugs Gate",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hms-sidebar">
      {/* Brand Header */}
      <div className="hms-brand">
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="hms-logo-box" style={{ background: "linear-gradient(135deg, #2D6A4F, #1B4332)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div className="hms-brand-info">
            <div className="hms-brand-name" style={{ color: "#FFFFFF", letterSpacing: "-0.01em" }}>DoseCheck</div>
            <div className="hms-brand-sub" style={{ color: "#74C69D" }}>Quality Gate Active</div>
          </div>
        </Link>
      </div>

      {/* Module Navigation */}
      <div className="hms-nav-section">
        <div className="hms-nav-label">DOSECHECK ENGINE</div>
        <nav className="hms-nav-list">
          {navItems.map((item) => {
            const isExact = pathname === item.href;
            const isDashboard = item.href.startsWith("/dashboard") && pathname === "/dashboard";
            const isActive = isExact || isDashboard;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`hms-nav-item ${isActive ? "active" : ""}`}
              >
                <span className="hms-nav-icon">{item.icon}</span>
                <span className="hms-nav-text">{item.label}</span>
                {item.badge && <span className="hms-nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="hms-sidebar-footer">
        <div className="hms-footer-card">
          <div className="hms-footer-title">
            <span className="hms-pulse-dot"></span>
            DoseCheck Gate Active
          </div>
          <div className="hms-footer-text">Deterministic Rules + Gemma 4 AI</div>
        </div>
      </div>
    </aside>
  );
}
