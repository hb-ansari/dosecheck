import { spawn } from "child_process";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const chromeProcess = spawn(CHROME_PATH, [
  "--headless=new",
  "--remote-debugging-port=9223",
  "--no-sandbox",
  "--disable-gpu",
  "--window-size=1600,1000",
  "http://localhost:3000/showcase",
]);

setTimeout(async () => {
  try {
    const res = await fetch("http://127.0.0.1:9223/json/list");
    const tabs = await res.json();
    const targetTab = tabs.find(t => t.url.includes("showcase"));
    if (!targetTab) {
      console.log("No showcase tab found in:", tabs.map(t => t.url));
      return;
    }

    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
    let frameCount = 0;

    ws.onopen = () => {
      console.log("Connected to Showcase tab! Starting screencast...");
      ws.send(JSON.stringify({
        id: 1,
        method: "Page.startScreencast",
        params: {
          format: "jpeg",
          quality: 85,
          maxWidth: 1600,
          maxHeight: 1000,
          everyNthFrame: 1
        }
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === "Page.screencastFrame") {
        frameCount++;
        // Ack the frame so Chrome continues sending next frames
        ws.send(JSON.stringify({
          id: 2,
          method: "Page.screencastFrameAck",
          params: { sessionId: msg.params.sessionId }
        }));
        if (frameCount % 10 === 0) {
          console.log(`Received ${frameCount} screencast frames! Frame size: ${msg.params.data.length} chars`);
        }
      }
    };

    setTimeout(() => {
      console.log(`Total frames received in 5s: ${frameCount}`);
      try { chromeProcess.kill(); } catch (e) {}
      process.exit(0);
    }, 6000);

  } catch (err) {
    console.error("Error:", err);
    try { chromeProcess.kill(); } catch (e) {}
    process.exit(1);
  }
}, 3000);

