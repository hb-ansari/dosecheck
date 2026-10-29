import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import CursorEffect from "@/components/CursorEffect";

export const metadata: Metadata = {
  title: "DoseCheck - Pre-Dispensing Quality Gate",
  description:
    "DoseCheck is a clinical pre-dispensing quality gate combining deterministic safety checks with Gemma 4 AI contextual review and Urdu patient counseling.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <CursorEffect />
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
