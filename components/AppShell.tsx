"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import NotchNavbar from "@/components/NotchNavbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/landing";

  if (isLandingPage) {
    return (
      <div className="landing-shell">
        <NotchNavbar />
        <main className="landing-main-content bg-grid-pattern">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <main className="page-content bg-grid-pattern">
          {children}
        </main>
      </div>
    </div>
  );
}
