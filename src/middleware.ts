import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

/* =========================================================
   Multi-tenant Middleware
   - Resolves workspace from subdomain OR /:workspaceSlug/*
   - Public routes: /, /login, /register, /api/auth
   - Authenticated routes: /:workspaceSlug/*
   - Sets x-workspace-id header for server-side resolution
========================================================= */

const PUBLIC_ROUTES = [
  "/", 
  "/login", 
  "/register", 
  "/demo", 
  "/pricing", 
  "/api/auth", 
  "/_next", 
  "/favicon.ico", 
  "/logo", 
  "/static",
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.some((p) => pathname.startsWith(p))) return true;
  if (pathname.startsWith("/api/invites/")) return true; // public invite endpoints
  if (pathname.startsWith("/invite/")) return true;      // public invite page
  if (pathname.includes(".")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Skip public routes + static assets
  if (PUBLIC_ROUTES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  if (pathname.includes(".")) {
    return NextResponse.next();
  }

  // ── Workspace Resolution ──
  // Priority 1: Subdomain (slug.crm-hub.com)
  // Priority 2: Path prefix /:workspaceSlug/...
  // Priority 3: Default workspace
  let workspaceSlug: string | null = null;
  const host = req.headers.get("host") ?? "";
  const rootDomain = process.env.ROOT_DOMAIN ?? "localhost:3000";
  const hostParts = host.replace(/:\d+$/, "").split(".");
  const rootParts = rootDomain.replace(/:\d+$/, "").split(".");

  if (hostParts.length > rootParts.length) {
    workspaceSlug = hostParts[0];
  }

  if (!workspaceSlug && pathname.length > 1) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] && !["api","login","register","demo","pricing"].includes(segments[0])) {
      workspaceSlug = segments[0];
    }
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

  // Attach workspace + user to request headers for downstream use
  const headers = new Headers(req.headers);
  if (workspaceSlug) {
    headers.set("x-workspace-slug", workspaceSlug);
  }
  if (user) {
    headers.set("x-user-id", user.userId);
    headers.set("x-workspace-id", user.workspaceId);
    headers.set("x-user-role", user.role);
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
