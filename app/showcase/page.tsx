"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Manifest {
  totalFrames: number;
  fps: number;
  duration: number;
  frames: string[];
}

const CHAPTERS = [
  { label: "1. Overview & Metrics", time: 0, frame: 1, desc: "Every dose verified • 100% Hard Stops" },
  { label: "2. Clinical Simulator", time: 4.8, frame: 72, desc: "Testing Metformin, Warfarin & Amoxicillin" },
  { label: "3. Control Center", time: 9.6, frame: 144, desc: "Real-time EHR Pre-dispensing queue" },
  { label: "4. Review & Urdu Counseling", time: 13.5, frame: 202, desc: "Deterministic Rule vs Gemma AI + Urdu" },
  { label: "5. Tamper-Proof Audit", time: 16.5, frame: 248, desc: "Pharmacist digital signature verification" },
];

export default function ShowcasePage() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [mode, setMode] = useState<"player" | "live">("player");
  const [activeTab, setActiveTab] = useState<"simulator" | "dashboard" | "review" | "audit">("simulator");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgCacheRef = useRef<HTMLImageElement[]>([]);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch frame manifest
  useEffect(() => {
    async function loadManifest() {
      try {
        const res = await fetch("/recording-frames/manifest.json");
        const data: Manifest = await res.json();
        setManifest(data);

        // Preload first 40 frames immediately, then lazily load the rest
        data.frames.forEach((f, idx) => {
          const img = new Image();
          img.src = `/recording-frames/${f}`;
          imgCacheRef.current[idx] = img;
        });
      } catch (e) {
        console.error("Failed to load frames manifest:", e);
      }
    }
    loadManifest();
  }, []);

  // Frame animation loop
  useEffect(() => {
    if (!isPlaying || !manifest || manifest.frames.length === 0) {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
      return;
    }

    const intervalMs = (1000 / manifest.fps) / playbackSpeed;
    animationTimerRef.current = setInterval(() => {
      setCurrentFrameIdx((prev) => {
        if (prev >= manifest.frames.length - 1) {
          return 0; // Loop seamlessly
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, [isPlaying, manifest, playbackSpeed]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const seekToFrame = (idx: number) => {
    if (!manifest) return;
    const clamped = Math.max(0, Math.min(manifest.frames.length - 1, idx));
    setCurrentFrameIdx(clamped);
  };

  const seekToChapter = (frame: number) => {
    seekToFrame(frame - 1);
  };

  const currentSeconds = manifest ? (currentFrameIdx / manifest.fps).toFixed(1) : "0.0";
  const totalSeconds = manifest ? manifest.duration.toFixed(1) : "18.0";
  const currentFrameName = manifest && manifest.frames[currentFrameIdx] ? manifest.frames[currentFrameIdx] : "frame_0001.jpg";

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: "100vh",
        background: "#07090e",
        color: "#f8fafc",
        padding: isFullscreen ? "0" : "32px 24px 60px",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ─── TOP NAVBAR & HEADER ─── */}
      {!isFullscreen && (
        <div style={{ maxWidth: "1520px", margin: "0 auto 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }}></span>
                <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "1.2px", color: "#38bdf8", textTransform: "uppercase" }}>
                  DOSECHECK SCREEN RECORDING LAB
                </span>
                <span style={{ background: "rgba(29, 104, 253, 0.15)", border: "1px solid rgba(29, 104, 253, 0.4)", color: "#93c5fd", padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "700" }}>
                  1600 × 1000 RETINA
                </span>
              </div>
              <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#ffffff", margin: 0, letterSpacing: "-0.5px" }}>
                Complete Web Application Walkthrough in Laptop Screen
              </h1>
              <p style={{ fontSize: "13px", color: "#94a3b8", margin: "4px 0 0" }}>
                Ultra-crisp 16:10 laptop screen recording capturing full clinical pre-dispensing verification across all DoseCheck modules.
              </p>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ display: "flex", background: "#131722", padding: "4px", borderRadius: "10px", border: "1px solid #232a3d" }}>
                <button
                  onClick={() => setMode("player")}
                  style={{
                    padding: "6px 14px",
                    background: mode === "player" ? "#2D6A4F" : "transparent",
                    color: mode === "player" ? "#ffffff" : "#94a3b8",
                    border: "none",
                    borderRadius: "7px",
                    fontWeight: "700",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  🎬 Walkthrough Player
                </button>
                <button
                  onClick={() => setMode("live")}
                  style={{
                    padding: "6px 14px",
                    background: mode === "live" ? "#2D6A4F" : "transparent",
                    color: mode === "live" ? "#ffffff" : "#94a3b8",
                    border: "none",
                    borderRadius: "7px",
                    fontWeight: "700",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  💻 Interactive Frame
                </button>
              </div>

              <Link
                href="/"
                style={{
                  padding: "9px 16px",
                  background: "#161b28",
                  border: "1px solid #283147",
                  color: "#cbd5e1",
                  textDecoration: "none",
                  borderRadius: "9px",
                  fontWeight: "600",
                  fontSize: "12px",
                }}
              >
                Back to Site ↗
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── CHAPTER SHORTCUT CHIPS ─── */}
      {!isFullscreen && mode === "player" && (
        <div style={{ maxWidth: "1520px", margin: "0 auto 16px", display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {CHAPTERS.map((ch, idx) => {
            const isCurrent =
              currentFrameIdx >= ch.frame - 1 &&
              (idx === CHAPTERS.length - 1 || currentFrameIdx < CHAPTERS[idx + 1].frame - 1);

            return (
              <button
                key={ch.label}
                onClick={() => seekToChapter(ch.frame)}
                style={{
                  padding: "6px 12px",
                  background: isCurrent ? "rgba(45, 106, 79, 0.25)" : "#10141f",
                  border: isCurrent ? "1px solid #52B788" : "1px solid #1f2638",
                  borderRadius: "8px",
                  color: isCurrent ? "#74C69D" : "#94a3b8",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "11px",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontWeight: isCurrent ? "700" : "600" }}>{ch.label}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── SCREEN DISPLAY (HIGH-RES FRAME PLAYER OR LIVE FRAME) ─── */}
      <div
        style={{
          maxWidth: "1520px",
          margin: "0 auto",
          background: "#080a11",
          borderRadius: isFullscreen ? "0" : "20px",
          border: isFullscreen ? "none" : "1px solid #1b2130",
          boxShadow: isFullscreen ? "none" : "0 30px 80px -20px rgba(0, 0, 0, 0.95)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {mode === "player" ? (
          <div style={{ position: "relative", width: "100%", lineHeight: 0 }}>
            {/* Display Current Walkthrough Frame */}
            <img
              src={`/recording-frames/${currentFrameName}`}
              alt={`Laptop Screen Recording Walkthrough - Frame ${currentFrameIdx + 1}`}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                objectFit: "contain",
                userSelect: "none",
              }}
            />

            {/* Subtle Screen Overlay Tag */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "24px",
                background: "rgba(10, 14, 23, 0.85)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "4px 10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                zIndex: 10,
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isPlaying ? "#ef4444" : "#eab308", animation: isPlaying ? "pulse 1.5s infinite" : "none" }}></span>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#f8fafc", letterSpacing: "0.5px" }}>
                {isPlaying ? "PLAYING SCREEN RECORDING" : "PAUSED"}
              </span>
            </div>
          </div>
        ) : (
          /* Live Interactive Iframe embedded inside Laptop Frame */
          <div style={{ padding: "30px 40px", background: "#0c0e16" }}>
            <div
              style={{
                background: "#1e2029",
                borderRadius: "20px 20px 4px 4px",
                border: "2px solid #383b4b",
                padding: "16px 16px 24px",
                boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
              }}
            >
              {/* Browser bar */}
              <div style={{ height: "40px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#151821", borderRadius: "10px 10px 0 0", padding: "0 16px", borderBottom: "1px solid #252b3c" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f56" }}></span>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ffbd2e" }}></span>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#27c93f" }}></span>
                </div>
                <div style={{ background: "#1a1e2b", border: "1px solid #2e3549", padding: "3px 20px", borderRadius: "14px", fontSize: "11px", color: "#94a3b8" }}>
                  🔒 https://dosecheck.health/
                </div>
                <div style={{ width: "30px" }}></div>
              </div>

              {/* Iframe */}
              <iframe
                src="/"
                style={{ width: "100%", height: "700px", border: "none", borderRadius: "0 0 8px 8px", background: "#0a0c13" }}
                title="DoseCheck Live Interactive View"
              />
            </div>
          </div>
        )}

        {/* ─── CINEMATIC PLAYER CONTROL BAR ─── */}
        {mode === "player" && (
          <div
            style={{
              background: "#0c0f18",
              borderTop: "1px solid #1a2030",
              padding: "14px 20px",
            }}
          >
            {/* Scrubber Progress Bar */}
            <div style={{ position: "relative", marginBottom: "12px" }}>
              <input
                type="range"
                min="0"
                max={manifest ? manifest.frames.length - 1 : 270}
                value={currentFrameIdx}
                onChange={(e) => seekToFrame(parseInt(e.target.value, 10))}
                style={{
                  width: "100%",
                  height: "6px",
                  borderRadius: "3px",
                  appearance: "none",
                  background: `linear-gradient(to right, #2D6A4F ${(currentFrameIdx / (manifest ? manifest.frames.length - 1 : 270)) * 100}%, #1f2537 ${(currentFrameIdx / (manifest ? manifest.frames.length - 1 : 270)) * 100}%)`,
                  cursor: "pointer",
                  outline: "none",
                }}
              />
            </div>

            {/* Playback Controls Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              {/* Left: Play/Pause, Rewind, Time */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  onClick={togglePlay}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#2D6A4F",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 10px rgba(45, 106, 79, 0.4)",
                  }}
                  title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                >
                  {isPlaying ? "❚❚" : "▶"}
                </button>

                <button
                  onClick={() => seekToFrame(currentFrameIdx - 15)}
                  style={{
                    background: "#161b28",
                    border: "1px solid #232a3d",
                    color: "#cbd5e1",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                  title="Rewind 1 second"
                >
                  ↺ -1s
                </button>

                <button
                  onClick={() => seekToFrame(currentFrameIdx + 15)}
                  style={{
                    background: "#161b28",
                    border: "1px solid #232a3d",
                    color: "#cbd5e1",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                  title="Fast forward 1 second"
                >
                  +1s ↻
                </button>

                <button
                  onClick={() => seekToFrame(0)}
                  style={{
                    background: "#161b28",
                    border: "1px solid #232a3d",
                    color: "#cbd5e1",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                  title="Restart recording"
                >
                  ⏮ Restart
                </button>

                {/* Time Display */}
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0", marginLeft: "6px" }}>
                  <span style={{ color: "#52B788" }}>{currentSeconds}s</span>
                  <span style={{ color: "#64748b" }}> / {totalSeconds}s</span>
                </div>
              </div>

              {/* Center: Current Chapter Indicator */}
              <div style={{ fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#74C69D", fontWeight: "700" }}>CURRENT SECTION:</span>
                <span>
                  {currentFrameIdx < 72
                    ? "Landing Overview & 3-Layer Architecture Strip"
                    : currentFrameIdx < 144
                    ? "Live Quality Gate Simulator (Metformin / Warfarin / Amox)"
                    : currentFrameIdx < 202
                    ? "Control Center Pre-Dispensing Queue (/dashboard)"
                    : currentFrameIdx < 248
                    ? "Clinical Review & Urdu Patient Counseling Transcript"
                    : "Tamper-Proof Verification Audit Trail"}
                </span>
              </div>

              {/* Right: Playback Speed, Fullscreen */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Speed:</span>
                {[0.5, 1, 1.5, 2].map((sp) => (
                  <button
                    key={sp}
                    onClick={() => setPlaybackSpeed(sp)}
                    style={{
                      background: playbackSpeed === sp ? "#2D6A4F" : "#141824",
                      border: playbackSpeed === sp ? "1px solid #52B788" : "1px solid #202738",
                      color: playbackSpeed === sp ? "#ffffff" : "#94a3b8",
                      padding: "4px 8px",
                      borderRadius: "5px",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    {sp}x
                  </button>
                ))}

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  style={{
                    background: "#161b28",
                    border: "1px solid #232a3d",
                    color: "#cbd5e1",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    cursor: "pointer",
                    marginLeft: "4px",
                  }}
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? "Exit Fullscreen" : "⛶ Fullscreen"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── HIGHLIGHT FEATURES WALKTHROUGH BREAKDOWN ─── */}
      {!isFullscreen && (
        <div style={{ maxWidth: "1520px", margin: "40px auto 0" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff", marginBottom: "16px" }}>
            Key Clinical Scenarios Captured in Screen Recording
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            <div style={{ background: "#0d111a", border: "1px solid #1c2233", borderRadius: "12px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#ef4444" }}>01. HARD-STOP CONTRAINDICATION</span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Frame 72-120</span>
              </div>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc", margin: "0 0 6px" }}>
                Metformin 1000mg BID in Severe CKD
              </h3>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                Patient presents with eGFR 22 mL/min. Layer 1 Deterministic rule DC-REN-04 halts release due to lactic acidosis risk. Gemma 4 suggests Linagliptin 5mg daily.
              </p>
            </div>

            <div style={{ background: "#0d111a", border: "1px solid #1c2233", borderRadius: "12px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#f97316" }}>02. DRUG-DRUG INTERACTION</span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Frame 120-144</span>
              </div>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc", margin: "0 0 6px" }}>
                Warfarin 5mg + Ciprofloxacin 500mg
              </h3>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                CYP1A2 inhibition elevates Warfarin levels, triggering high hemorrhage risk. The system alerts the pharmacist to substitute Cephalexin.
              </p>
            </div>

            <div style={{ background: "#0d111a", border: "1px solid #1c2233", borderRadius: "12px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#10b981" }}>03. AUTOMATED URDU COUNSELING</span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Frame 202-248</span>
              </div>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc", margin: "0 0 6px" }}>
                Bilingual Urdu Patient Instructions
              </h3>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                Renders native Urdu translation instructing the patient clearly about why the medication was withheld and what action their physician will take.
              </p>
            </div>

            <div style={{ background: "#0d111a", border: "1px solid #1c2233", borderRadius: "12px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#38bdf8" }}>04. PHARMACIST SIGNATURE AUDIT</span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Frame 248-271</span>
              </div>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc", margin: "0 0 6px" }}>
                Tamper-Proof Audit Trail
              </h3>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                Every verification event, override rationale, and timestamp is logged cryptographically with the licensed pharmacist ID.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
