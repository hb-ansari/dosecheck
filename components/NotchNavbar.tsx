"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NotchNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Overview" },
    { href: "/#clinical-safety", label: "Clinical Safety" },
    { href: "/#simulator", label: "Live Simulator" },
    { href: "/#workflow", label: "Workflow" },
    { href: "/dashboard", label: "Control Center" },
    { href: "/audit", label: "Audit Queue" },
    { href: "/showcase", label: "💻 Laptop Screen" },
    { href: "/new", label: "+ New Rx" },
  ];

  return (
    <>
      <header className="dosecheck-notch-wrapper">
        <nav className="dosecheck-notch-nav" aria-label="Main Navigation">
          {/* Brand Logo & Name */}
          <Link href="/" className="notch-brand" style={{ textDecoration: "none" }}>
            <div className="notch-logo-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <div className="notch-brand-text">
              <span className="notch-brand-title">DoseCheck</span>
              <span className="notch-brand-tag">QUALITY GATE</span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="notch-links-group">
            {navLinks.map((link) => {
              const isActive = link.href === pathname;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`notch-nav-link ${isActive ? "active" : ""}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Action CTA */}
          <div className="notch-actions-group">
            <Link href="/dashboard" className="notch-cta-btn" style={{ textDecoration: "none" }}>
              <span>Launch Control Center</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>

            {/* Mobile Hamburger */}
            <button
              className="notch-mobile-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile navigation menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round"/>
                )}
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="notch-mobile-drawer">
          <div className="notch-mobile-links">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="notch-mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="notch-cta-btn"
              style={{ marginTop: "12px", justifyContent: "center" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Launch Control Center
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
