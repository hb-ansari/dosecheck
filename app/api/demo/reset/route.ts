import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(request: Request) {
  // Protect with DEMO_ADMIN_KEY header
  const adminKey = process.env.DEMO_ADMIN_KEY;
  const providedKey = request.headers.get("x-demo-admin-key");

  if (!adminKey || providedKey !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await store.resetDemo();
    return NextResponse.json({ success: true, message: "Demo data reset successfully" });
  } catch (err) {
    console.error("[/api/demo/reset] Error:", (err as Error).message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
