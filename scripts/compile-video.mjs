import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUTPUT_FILE = path.join(process.cwd(), "dosecheck-laptop-recording.webm");

console.log("[Compiler Runner] Starting headless Chrome to compile 271 frames into WebM video...");

const chromeProcess = spawn(CHROME_PATH, [
  "--headless=new",
  "--remote-debugging-port=9225",
  "--no-sandbox",
  "--disable-gpu",
  "--window-size=1600,1050",
  "http://localhost:3000/compiler",
]);

setTimeout(async () => {
  try {
    const res = await fetch("http://127.0.0.1:9225/json/list");
    const tabs = await res.json();
    const targetTab = tabs.find((t) => t.url.includes("compiler"));

    if (!targetTab) {
      console.error("[Compiler Runner] No compiler tab found:", tabs);
      return;
    }

    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      console.log("[Compiler Runner] Connected to compiler tab! Monitoring progress...");
      ws.send(JSON.stringify({ id: 1, method: "Runtime.enable" }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === "Runtime.consoleAPICalled") {
        const text = msg.params.args.map((a) => a.value || a.description).join(" ");
        console.log("[Browser Console]", text);
      }
    };
  } catch (e) {
    console.error("Monitor error:", e);
  }
}, 3000);

const startTime = Date.now();
const interval = setInterval(() => {
  if (fs.existsSync(OUTPUT_FILE)) {
    const stats = fs.statSync(OUTPUT_FILE);
    if (stats.size > 200000) {
      console.log(`\n[Compiler Runner] Success! Compiled WebM video generated.`);
      console.log(`[Compiler Runner] Output File: ${OUTPUT_FILE}`);
      console.log(`[Compiler Runner] Video Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      clearInterval(interval);
      try {
        chromeProcess.kill();
      } catch (e) {}
      process.exit(0);
    }
  }

  if (Date.now() - startTime > 35000) {
    console.log("[Compiler Runner] Timeout waiting for compiler.");
    clearInterval(interval);
    try {
      chromeProcess.kill();
    } catch (e) {}
    process.exit(1);
  }
}, 1000);

