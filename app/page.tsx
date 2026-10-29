"use client";

import React, { Suspense } from "react";
import LandingHero from "@/components/LandingHero";
import LandingBenefits from "@/components/LandingBenefits";
import LandingWorkflow from "@/components/LandingWorkflow";
import LandingFooter from "@/components/LandingFooter";

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>Loading DoseCheck Quality Gate...</div>}>
      <div className="landing-page-wrapper">
        <LandingHero />
        <LandingBenefits />
        <LandingWorkflow />
        <LandingFooter />
      </div>
    </Suspense>
  );
}
