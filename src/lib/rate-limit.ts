import { type NextRequest, NextResponse } from "next/server";

const buckets = new Map<string, { tokens: number; lastUpdate: number }>();

export function rateLimit(
  key: string,
  maxTokens = 60,
  windowMs = 60000,
  tokenCost = 1
): { allowed: boolean; resetMs: number } {
  const now = Date.now();
  const record = buckets.get(key) ?? { tokens: maxTokens, lastUpdate: now };
  // Refill tokens based on elapsed time
  const elapsed = now - record.lastUpdate;
  const refill = (elapsed / windowMs) * maxTokens;
  let tokens = Math.min(maxTokens, record.tokens + refill);
  if (tokens >= tokenCost) {
    tokens -= tokenCost;
    buckets.set(key, { tokens, lastUpdate: now });
    return { allowed: true, resetMs: windowMs - elapsed };
  }
  buckets.set(key, { tokens, lastUpdate: record.lastUpdate });
  const resetMs = windowMs - elapsed;
  return { allowed: false, resetMs: Math.max(0, resetMs) };
}

export function withRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  opts?: { keyPrefix?: string; windowMs?: number; maxRequests?: number }
): (req: NextRequest, ...args: any[]) => Promise<NextResponse> {
  const { keyPrefix, windowMs = 60_000, maxRequests = 60 } = opts ?? {};
  return async function inner(req: NextRequest, ...args: any[]) {
    const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    const route = keyPrefix ?? req.nextUrl.pathname;
    const key = `${ip}:${route}:rl`;
    const result = rateLimit(key, maxRequests, windowMs, 1);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(result.resetMs / 1000)) } }
      );
    }
    return handler(req, ...args);
  };
}
