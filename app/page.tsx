"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LandingHero from "@/components/LandingHero";
import LandingBenefits from "@/components/LandingBenefits";
import LandingWorkflow from "@/components/LandingWorkflow";
import LandingFooter from "@/components/LandingFooter";
import DashboardPage from "@/app/dashboard/page";

function HomePageContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");

  // If user requests the landing page specifically via ?view=landing
  if (view === "landing") {
    return (
      <div className="landing-page-wrapper">
        <LandingHero />
        <LandingBenefits />
        <LandingWorkflow />
        <LandingFooter />
      </div>
    );
  }

  // Otherwise, default to the Control Center so http://localhost:3000/ immediately displays the exact dashboard
  return <DashboardPage />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ padding: "60px", textAlign: "center" }}>Loading DoseCheck Control Center...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
