import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FRAMES_DIR = path.join(process.cwd(), "public", "recording-frames");

if (!fs.existsSync(FRAMES_DIR)) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

console.log("[Walkthrough Recorder] Starting Chrome to capture laptop screen recording...");

const chromeProcess = spawn(CHROME_PATH, [
  "--headless=new",
  "--remote-debugging-port=9224",
  "--no-sandbox",
  "--disable-gpu",
  "--window-size=1600,1050",
  "http://localhost:3000/showcase",
]);

setTimeout(async () => {
  try {
    const res = await fetch("http://127.0.0.1:9224/json/list");
    const tabs = await res.json();
    const targetTab = tabs.find((t) => t.url.includes("showcase"));

    if (!targetTab) {
      console.error("[Walkthrough Recorder] Could not find showcase tab:", tabs);
      chromeProcess.kill();
      process.exit(1);
    }

    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
    let frameIndex = 0;
    const frameFiles = [];

    ws.onopen = () => {
      console.log("[Walkthrough Recorder] Connected to CDP! Starting automated walkthrough and screen recording...");
      // Trigger recording via evaluate or screencast
      ws.send(
        JSON.stringify({
          id: 1,
          method: "Page.startScreencast",
          params: {
            format: "jpeg",
            quality: 85,
            maxWidth: 1600,
            maxHeight: 1000,
            everyNthFrame: 1,
          },
        })
      );

      // Start the automated walkthrough in the page
      ws.send(
        JSON.stringify({
          id: 2,
          method: "Runtime.evaluate",
          params: {
            expression: `
              if (window.__startWalkthrough) {
                window.__startWalkthrough();
              } else {
                const btn = document.querySelector('button');
                if (btn) btn.click();
              }
            `,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === "Page.screencastFrame") {
        frameIndex++;
        const filename = `frame_${String(frameIndex).padStart(4, "0")}.jpg`;
        const filepath = path.join(FRAMES_DIR, filename);
        const buffer = Buffer.from(msg.params.data, "base64");
        fs.writeFileSync(filepath, buffer);
        frameFiles.push(filename);

        ws.send(
          JSON.stringify({
            id: 3,
            method: "Page.screencastFrameAck",
            params: { sessionId: msg.params.sessionId },
          })
        );

        if (frameIndex % 15 === 0) {
          process.stdout.write(`\r[Walkthrough Recorder] Captured ${frameIndex} frames (${(frameIndex / 15).toFixed(1)}s elapsed)...`);
        }
      }
    };

    // Capture for 22 seconds
    setTimeout(() => {
      console.log(`\n[Walkthrough Recorder] Finished capturing! Total frames: ${frameIndex}`);

      // Write manifest of frames for the player
      fs.writeFileSync(
        path.join(FRAMES_DIR, "manifest.json"),
        JSON.stringify({
          totalFrames: frameIndex,
          fps: 15,
          duration: frameIndex / 15,
          frames: frameFiles,
        }, null, 2)
      );

      console.log(`[Walkthrough Recorder] Frame manifest saved to public/recording-frames/manifest.json`);

      try {
        chromeProcess.kill();
      } catch (e) {}
      process.exit(0);
    }, 24000);
  } catch (err) {
    console.error("[Walkthrough Recorder] Error:", err);
    try {
      chromeProcess.kill();
    } catch (e) {}
    process.exit(1);
  }
}, 3000);

