import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

/* =========================================================
   Multi-tenant Middleware
   - Resolves workspace from subdomain OR /:workspaceSlug/*
   - Resolves business from subdomain OR /:businessSlug/:workspaceSlug/*
   - Rewrites /:businessSlug/:workspaceSlug/... → /:workspaceSlug/...
     so existing app routes work without duplication.
   - Public routes: /, /login, /register, /api/auth
   - Authenticated routes: /:workspaceSlug/*
   - Sets x-workspace-id, x-business-id headers
========================================================= */

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/demo",
  "/pricing",
  "/api/auth",
  "/api/capture",
  "/api/automation/cron",
  "/api/widget.js",
  "/_next",
  "/favicon.ico",
  "/logo",
  "/static",
  "/owner",
];

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (pathname.startsWith("/api/invites/")) return true;
  if (pathname.startsWith("/invite/")) return true;
  if (pathname.includes(".")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Skip public routes + static assets
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // ── Host / Subdomain Resolution ──
  const host = req.headers.get("host") ?? "";
  const rootDomain = process.env.ROOT_DOMAIN ?? "localhost:3000";
  const hostParts = host.replace(/:\d+$/, "").split(".");
  const rootParts = rootDomain.replace(/:\d+$/, "").split(".");

  let subdomainSlug: string | null = null;
  if (hostParts.length > rootParts.length) {
    subdomainSlug = hostParts[0];
  }

  // ── Path Resolution ──
  let businessSlug: string | null = null;
  let workspaceSlug: string | null = null;
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length >= 2) {
    const first = segments[0];
    const second = segments[1];
    if (["api","login","register","demo","pricing","owner"].includes(first)) {
      // public/api segment — nothing to resolve
    } else if (["api","login","register","demo","pricing","owner"].includes(second)) {
      // /:workspaceSlug/dashboard etc (second is a page)
      workspaceSlug = first;
    } else {
      // /:businessSlug/:workspaceSlug/*
      businessSlug = first;
      workspaceSlug = second;
    }
  } else if (segments.length === 1) {
    const first = segments[0];
    if (!["api","login","register","demo","pricing","owner"].includes(first)) {
      workspaceSlug = first;
    }
  }

  // Subdomain takes precedence for business
  if (subdomainSlug) {
    businessSlug = subdomainSlug;
  }

  // ── Auth Check ──
  const token = req.cookies.get("session")?.value ?? null;
  let user: { userId: string; workspaceId: string; role: string } | null = null;
  if (token) {
    user = await verifyToken(token);
  }

  // If unauthenticated but on workspace route → redirect to login
  if (!user && workspaceSlug) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
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
    headers.set("x-workspace-id", user.workspaceId);
    headers.set("x-user-role", user.role);
  }

  // ── Rewrite for multi-business URLs ──
  // /claraccord/mintagree/dashboard  →  /mintagree/dashboard
  if (businessSlug && workspaceSlug) {
    const rewrittenPath = pathname.replace(`/${businessSlug}/${workspaceSlug}`, `/${workspaceSlug}`);
    const url = req.nextUrl.clone();
    url.pathname = rewrittenPath;
    return NextResponse.rewrite(url, { request: { headers } });
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
