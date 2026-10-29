import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const TARGET_URL = "http://localhost:3000/showcase?autorecord=true";
const OUTPUT_FILE = path.join(process.cwd(), "dosecheck-laptop-recording.webm");
const PUBLIC_FILE = path.join(process.cwd(), "public", "dosecheck-laptop-recording.webm");

console.log("[Generator] Starting headless Chrome to record laptop screen walkthrough...");

// Clean up any old output file
if (fs.existsSync(OUTPUT_FILE)) {
  fs.unlinkSync(OUTPUT_FILE);
}
if (fs.existsSync(PUBLIC_FILE)) {
  fs.unlinkSync(PUBLIC_FILE);
}

const chromeArgs = [
  "--headless=new",
  "--remote-debugging-port=9222",
  "--disable-gpu",
  "--no-sandbox",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding",
  "--autoplay-policy=no-user-gesture-required",
  "--window-size=1680,1050",
  TARGET_URL,
];

const chromeProcess = spawn(CHROME_PATH, chromeArgs, {
  stdio: "inherit",
});

console.log(`[Generator] Chrome launched with PID: ${chromeProcess.pid}`);
console.log(`[Generator] Recording 20-second walkthrough in progress...`);

const startTime = Date.now();
const maxWaitMs = 60000;

const interval = setInterval(() => {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  process.stdout.write(`\r[Generator] Waiting for recording to complete (${elapsed}s)...`);

  if (fs.existsSync(OUTPUT_FILE)) {
    const stats = fs.statSync(OUTPUT_FILE);
    if (stats.size > 100000) {
      console.log(`\n[Generator] Video recorded and saved successfully!`);
      console.log(`[Generator] Output File: ${OUTPUT_FILE}`);
      console.log(`[Generator] File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      clearInterval(interval);
      try {
        chromeProcess.kill();
      } catch (e) {}
      process.exit(0);
    }
  }

  if (Date.now() - startTime > maxWaitMs) {
    console.error(`\n[Generator] Timed out waiting for recording after ${maxWaitMs / 1000}s`);
    clearInterval(interval);
    try {
      chromeProcess.kill();
    } catch (e) {}
    process.exit(1);
  }
}, 1000);
