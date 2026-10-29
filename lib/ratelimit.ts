/**
 * Simple in-memory IP rate limiter using a sliding window.
 * NOTE: On serverless (Vercel), each instance has its own memory.
 * This is best-effort only and is acceptable for a hackathon demo.
 * See README → Limitations for details.
 */

interface Window {
  timestamps: number[];
}

const windows = new Map<string, Window>();

const WINDOW_MS = 60_000; // 1 minute

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const limit = parseInt(process.env.RATE_LIMIT_PER_MIN ?? "20", 10);
  const now = Date.now();

  let win = windows.get(ip);
  if (!win) {
    win = { timestamps: [] };
    windows.set(ip, win);
  }

  // Remove timestamps older than 1 minute
  win.timestamps = win.timestamps.filter((t) => now - t < WINDOW_MS);

  if (win.timestamps.length >= limit) {
    return { allowed: false, remaining: 0 };
  }

  win.timestamps.push(now);
  return { allowed: true, remaining: limit - win.timestamps.length };
}

/** Extract the client IP from Next.js request headers */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
