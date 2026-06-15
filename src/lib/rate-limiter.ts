import { RateLimiterMemory } from "rate-limiter-flexible";

// ── API Rate Limiter ─────────────────────────────────────
// Protects against DDoS and API abuse
// Configured for: 100 requests per minute per IP

const limiter = new RateLimiterMemory({
  points: 100,
  duration: 60, // 60 seconds
  keyPrefix: "api-rate-limit",
});

// ── Auth Rate Limiter ────────────────────────────────────
// Stricter limits for login/register endpoints
// 5 attempts per minute to prevent brute force

const authLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60,
  keyPrefix: "auth-rate-limit",
});

// ── Export middleware helper ────────────────────────────
export async function checkRateLimit(ip: string, type: "api" | "auth" = "api"): Promise<{
  success: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const rateLimiter = type === "auth" ? authLimiter : limiter;
  
  try {
    const result = await rateLimiter.consume(ip);
    return {
      success: true,
      remaining: result.remainingPoints,
      resetAt: new Date(Date.now() + result.msBeforeNext),
    };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "msBeforeNext" in error) {
      const rateLimiterRes = error as { msBeforeNext: number; remainingPoints: number };
      return {
        success: false,
        remaining: rateLimiterRes.remainingPoints,
        resetAt: new Date(Date.now() + rateLimiterRes.msBeforeNext),
      };
    }
    throw error;
  }
}

// ── Express-style middleware for Next.js ─────────────────
export function createRateLimitMiddleware(type: "api" | "auth" = "api") {
  return async (ip: string): Promise<Response | null> => {
    const result = await checkRateLimit(ip, type);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          message: `Rate limit exceeded. Try again in ${Math.ceil(result.resetAt.getTime() - Date.now()) / 1000} seconds.`,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(result.resetAt.getTime() - Date.now()) / 1000),
            "X-RateLimit-Limit": type === "auth" ? "5" : "100",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.floor(result.resetAt.getTime() / 1000)),
          },
        }
      );
    }
    
    return null;
  };
}
