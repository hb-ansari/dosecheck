import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let buffer: Buffer;

    if (contentType.includes("application/json")) {
      const data = await req.json();
      const base64Data = data.video.replace(/^data:video\/\w+;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    } else {
      const arrayBuffer = await req.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const publicFilePath = path.join(publicDir, "dosecheck-laptop-recording.webm");
    const rootFilePath = path.join(process.cwd(), "dosecheck-laptop-recording.webm");

    fs.writeFileSync(publicFilePath, buffer);
    fs.writeFileSync(rootFilePath, buffer);

    console.log(`[Screen Recorder] Successfully saved recording: ${buffer.length} bytes`);

    return NextResponse.json({
      success: true,
      bytes: buffer.length,
      publicPath: "/dosecheck-laptop-recording.webm",
      rootPath: "dosecheck-laptop-recording.webm",
    });
  } catch (err: any) {
    console.error("[Screen Recorder] Error saving recording:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

