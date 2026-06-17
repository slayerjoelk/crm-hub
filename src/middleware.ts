import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";
import { isAuthRequired } from "./lib/auth-config";

/* =========================================================
   Multi-tenant Middleware with Security Hardening
   - Resolves workspace from subdomain OR /:workspaceSlug/*
   - Resolves business from subdomain OR /:businessSlug/:workspaceSlug/*
   - Rewrites /:businessSlug/:workspaceSlug/... → /:workspaceSlug/...
   - Public routes: /, /login, /register, /api/auth
   - Authenticated routes: /:workspaceSlug/*
   - Sets x-workspace-id, x-business-id headers
   - Adds security headers to all responses
   - AUTH DISABLED: Set REQUIRE_AUTH=true to re-enable
========================================================= */

// ── AUTH (fail-secure) ────────────────────────────────────
// Always enforced in production; bypassed only for local dev. See lib/auth-config.
const REQUIRE_AUTH = isAuthRequired();

// First-path segments that are NOT workspaces (reserved app routes)
const RESERVED = new Set(["api", "login", "register", "pricing", "owner", "portfolio", "invite", "demo-marketing"]);

// Known in-app page names — used to tell /:workspace/:page apart from /:business/:workspace
const PAGE_SEGMENTS = new Set([
  "dashboard", "leads", "contacts", "companies", "deals", "quotes", "pipelines", "tasks",
  "prospecting", "campaigns", "cases", "activities", "emails", "templates", "sequences",
  "workflows", "automation", "reports", "forecast", "tags", "import", "analytics", "search", "settings",
]);

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/pricing",
  "/api/auth",
  "/api/capture",
  "/api/automation/cron",
  "/api/track",
  "/api/webhooks",
  "/api/widget.js",
  "/_next",
  "/favicon.ico",
  "/logo",
  "/static",
  "/owner",
  "/portfolio",
  "/api/portfolio",
  "/api/businesses",
];

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (pathname.startsWith("/api/invites/")) return true;
  if (pathname.startsWith("/invite/")) return true;
  if (pathname.includes(".")) return true;
  return false;
}

// ── SECURITY HEADERS ──────────────────────────────────────
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = {
  "Content-Security-Policy": CSP_DIRECTIVES,
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Skip public routes + static assets
  if (isPublicRoute(pathname)) {
    const response = NextResponse.next();
    // Add security headers to public routes too
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // ── Host / Subdomain Resolution ─────────────────────────
  const host = req.headers.get("host") ?? "";
  const rootDomain = process.env.ROOT_DOMAIN ?? "localhost:3000";
  const hostParts = host.replace(/:\d+$/, "").split(".");
  const rootParts = rootDomain.replace(/:\d+$/, "").split(".");

  let subdomainSlug: string | null = null;
  if (hostParts.length > rootParts.length) {
    subdomainSlug = hostParts[0];
  }

  // ── Path Resolution ─────────────────────────────────────
  // URL shapes: /:workspace/:page  OR  /:business/:workspace/:page
  // We disambiguate by whether segment[1] is a known app page name.
  let businessSlug: string | null = null;
  let workspaceSlug: string | null = null;
  const segments = pathname.split("/").filter(Boolean);

  // Resolve workspace/business from a list of path segments
  function resolveFrom(segs: string[]): { ws: string | null; biz: string | null } {
    if (segs.length === 0) return { ws: null, biz: null };
    if (RESERVED.has(segs[0])) return { ws: null, biz: null };
    if (segs.length === 1) return { ws: segs[0], biz: null };
    // /:workspace/:page  (segment[1] is a page) vs /:business/:workspace/...
    if (PAGE_SEGMENTS.has(segs[1])) return { ws: segs[0], biz: null };
    return { ws: segs[1], biz: segs[0] };
  }

  if (!pathname.startsWith("/api/")) {
    const r = resolveFrom(segments);
    workspaceSlug = r.ws; businessSlug = r.biz;
  } else {
    // /api/* — workspace isn't in the path; derive it from the Referer (the
    // page issuing the request). This is what makes "select a company → see
    // ITS data" work: every API read/write is scoped to its page's workspace.
    const referer = req.headers.get("referer") || "";
    try {
      const r = resolveFrom(new URL(referer).pathname.split("/").filter(Boolean));
      workspaceSlug = r.ws; businessSlug = r.biz;
    } catch { /* no/invalid referer — fall through to dev fallback */ }
  }

  // Subdomain takes precedence for business
  if (subdomainSlug) {
    businessSlug = subdomainSlug;
  }

  // ── Auth Check ──────────────────────────────────────────
  let user: { userId: string; workspaceId: string; role: string } | null = null;
  
  if (REQUIRE_AUTH) {
    const token = req.cookies.get("session")?.value ?? null;
    if (token) {
      user = await verifyToken(token);
    }
    
    // If unauthenticated but on workspace route → redirect to login
    if (!user && workspaceSlug) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  } else {
    // Auth disabled — dummy dev user. Leave workspaceId empty so the API layer
    // resolves the REAL workspace from x-workspace-slug (set below), not a fake id.
    if (workspaceSlug) {
      user = {
        userId: "dev-user",
        workspaceId: "",
        role: "admin",
      };
    }
  }

  // Attach workspace + user + business to request headers for downstream use
  const headers = new Headers(req.headers);
  if (workspaceSlug) {
    headers.set("x-workspace-slug", workspaceSlug);
  }
  if (businessSlug) {
    headers.set("x-business-slug", businessSlug);
  }
  if (user) {
    headers.set("x-user-id", user.userId);
    if (user.workspaceId) headers.set("x-workspace-id", user.workspaceId);
    headers.set("x-user-role", user.role);
  }

  // ── Rewrite for multi-business URLs ────────────────────
  // /claraccord/mintagree/dashboard  →  /mintagree/dashboard
  if (businessSlug && workspaceSlug) {
    const rewrittenPath = pathname.replace(`/${businessSlug}/${workspaceSlug}`, `/${workspaceSlug}`);
    const url = req.nextUrl.clone();
    url.pathname = rewrittenPath;
    const response = NextResponse.rewrite(url, { request: { headers } });
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  const response = NextResponse.next({ request: { headers } });
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
