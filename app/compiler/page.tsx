"use client";

import React, { useState, useEffect } from "react";

export default function CompilerPage() {
  const [status, setStatus] = useState("Loading manifest...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function compile() {
      try {
        setStatus("Fetching manifest...");
        const res = await fetch("/recording-frames/manifest.json");
        const manifest = await res.json();
        const frames: string[] = manifest.frames;

        setStatus(`Loaded ${frames.length} frames. Initializing canvas & recorder...`);

        const canvas = document.createElement("canvas");
        canvas.width = 1600;
        canvas.height = 1000;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No 2d context");

        const stream = canvas.captureStream(30);
        let mimeType = "video/webm;codecs=vp9";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "video/webm";
        }

        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 6000000,
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          setStatus("Compiling WebM Blob and saving to disk...");
          const blob = new Blob(chunks, { type: mimeType });
          console.log("[Compiler] Final WebM Blob size:", blob.size);

          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = reader.result as string;
            const postRes = await fetch("/api/record/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ video: base64 }),
            });
            const data = await postRes.json();
            console.log("[Compiler] Saved video successfully:", data);
            setStatus(`SUCCESS! Saved ${blob.size} bytes (${(blob.size / 1024 / 1024).toFixed(2)} MB) to disk.`);
            (window as any).__done = true;
          };
          reader.readAsDataURL(blob);
        };

        recorder.start(100);

        // Preload and draw frames sequentially at 30fps (33.3ms per frame)
        for (let i = 0; i < frames.length; i++) {
          const img = new Image();
          img.src = `/recording-frames/${frames[i]}`;
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setProgress(Math.round(((i + 1) / frames.length) * 100));
          await new Promise((r) => setTimeout(r, 1000 / 30));
        }

        // Hold last frame for 1 second
        await new Promise((r) => setTimeout(r, 1000));
        recorder.stop();
      } catch (err: any) {
        console.error("Compilation error:", err);
        setStatus("Error: " + err.message);
      }
    }

    compile();
  }, []);

  return (
    <div style={{ padding: "40px", background: "#0a0c12", color: "#fff", fontFamily: "sans-serif" }}>
      <h1>WebM Screen Recording Compiler</h1>
      <p style={{ color: "#38bdf8", fontSize: "18px" }}>Status: {status}</p>
      <p style={{ color: "#10b981", fontSize: "16px" }}>Progress: {progress}%</p>
    </div>
  );
}

