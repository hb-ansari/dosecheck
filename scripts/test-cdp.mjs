import { spawn } from "child_process";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const chromeProcess = spawn(CHROME_PATH, [
  "--headless=new",
  "--remote-debugging-port=9222",
  "--no-sandbox",
  "--disable-gpu",
  "--user-data-dir=C:\\Users\\Muhammad Bilal\\AppData\\Local\\Temp\\chrome_debug",
  "http://localhost:3000/showcase?autorecord=true",
]);

console.log("Spawned Chrome with PID:", chromeProcess.pid);

setTimeout(async () => {
  try {
    const res = await fetch("http://127.0.0.1:9222/json/list");
    const tabs = await res.json();
    console.log("Open tabs:", tabs);

    if (tabs.length > 0) {
      const wsUrl = tabs[0].webSocketDebuggerUrl;
      console.log("Connecting to:", wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected to Chrome page!");
        // Enable Console and Runtime
        ws.send(JSON.stringify({ id: 1, method: "Runtime.enable" }));
        ws.send(JSON.stringify({ id: 2, method: "Log.enable" }));
        ws.send(JSON.stringify({ id: 3, method: "Console.enable" }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === "Runtime.consoleAPICalled") {
          console.log("[Browser Console]", msg.params.type, msg.params.args.map(a => a.value || a.description));
        } else if (msg.method === "Runtime.exceptionThrown") {
          console.error("[Browser Exception]", msg.params.exceptionDetails);
        }
      };
    }
  } catch (err) {
    console.error("CDP fetch error:", err);
  }
}, 3000);

setTimeout(() => {
  try {
    chromeProcess.kill();
  } catch (e) {}
  process.exit(0);
}, 25000);

