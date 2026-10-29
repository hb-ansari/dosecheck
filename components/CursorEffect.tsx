"use client";

import React, { useEffect, useRef, useState } from "react";

export default function CursorEffect() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only run on non-touch devices with fine pointers
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) setIsVisible(true);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }

      // Check if hovering over interactive element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.closest("button") ||
          target.closest("a") ||
          target.closest("input") ||
          target.closest("select") ||
          target.closest(".hms-tab-link") ||
          target.closest(".hms-nav-item") ||
          target.closest(".hms-metric-card") ||
          target.closest(".benefit-card") ||
          target.closest(".simulator-tab-btn") ||
          target.closest("tr"))
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const animateRing = () => {
      // Smooth lerp (linear interpolation) for trailing ring
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }

      rafId = requestAnimationFrame(animateRing);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    rafId = requestAnimationFrame(animateRing);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, [isVisible]);

  return (
    <>
      {/* Inner precise dot */}
      <div
        ref={dotRef}
        className={`dosecheck-cursor-dot ${isVisible ? "visible" : ""} ${isHovering ? "hovering" : ""}`}
        aria-hidden="true"
      />
      {/* Outer fluid trailing ring */}
      <div
        ref={ringRef}
        className={`dosecheck-cursor-ring ${isVisible ? "visible" : ""} ${isHovering ? "hovering" : ""}`}
        aria-hidden="true"
      />
    </>
  );
}
