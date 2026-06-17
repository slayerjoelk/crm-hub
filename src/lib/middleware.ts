import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { isAuthDisabled } from "@/lib/auth-config";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export interface WorkspaceContext {
  workspaceId: string;
  userId: string;
  role: string;
}

export interface BusinessContext extends WorkspaceContext {
  businessId: string | null;
  businessSlug: string | null;
}

// When auth is disabled for development, API routes (called at /api/* with no
// workspace in the path) still need a workspace. Resolve a stable dev context
// — first active workspace + any user in it — so the app works end-to-end
// without a session. Fail-secure: never active in production (see auth-config).
const DEV_AUTH_DISABLED = isAuthDisabled();

async function devFallbackContext(slug?: string | null): Promise<{ workspaceId: string; userId: string; role: string } | null> {
  if (!DEV_AUTH_DISABLED) return null;
  try {
    // Prefer the workspace the request is scoped to (from x-workspace-slug,
    // derived from the page URL) so each company sees ITS OWN data.
    let ws: any = null;
    if (slug) {
      [ws] = await db.select().from(schema.workspaces).where(eq(schema.workspaces.slug, slug));
    }
    if (!ws) {
      const active = await db.select().from(schema.workspaces).where(eq(schema.workspaces.status, "active"));
      ws = active[0] ?? (await db.select().from(schema.workspaces))[0];
    }
    if (!ws) return null;
    const [user] = await db.select().from(schema.users).where(eq(schema.users.workspaceId, ws.id));
    return { workspaceId: ws.id, userId: user?.id || "dev-user", role: "admin" };
  } catch {
    return null;
  }
}

export async function withWorkspace(
  req: NextRequest,
  handler: (ctx: WorkspaceContext) => Promise<NextResponse>
): Promise<NextResponse> {
  let workspaceId = req.headers.get("x-workspace-id");
  let userId = req.headers.get("x-user-id");
  let role = req.headers.get("x-user-role");

  // Fallback to session cookie if middleware headers are absent
  if (!workspaceId || !userId) {
    const token = req.cookies.get("session")?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        workspaceId = payload.workspaceId;
        userId = payload.userId;
        role = payload.role;
      }
    }
  }

  // Dev fallback (auth disabled) so /api/* works without a session, scoped to
  // the workspace the page is for (x-workspace-slug from the Referer).
  if (!workspaceId || !userId) {
    const dev = await devFallbackContext(req.headers.get("x-workspace-slug"));
    if (dev) { workspaceId = dev.workspaceId; userId = dev.userId; role = dev.role; }
  }

  if (!workspaceId || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handler({ workspaceId, userId, role: role || "member" });
}

export async function withBusiness(
  req: NextRequest,
  handler: (ctx: BusinessContext) => Promise<NextResponse>
): Promise<NextResponse> {
  let workspaceId = req.headers.get("x-workspace-id");
  let userId = req.headers.get("x-user-id");
  let role = req.headers.get("x-user-role");
  let businessId = req.headers.get("x-business-id");
  let businessSlug = req.headers.get("x-business-slug");

  // Fallback to session cookie if middleware headers are absent
  if (!workspaceId || !userId) {
    const token = req.cookies.get("session")?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        workspaceId = payload.workspaceId;
        userId = payload.userId;
        role = payload.role;
      }
    }
  }

  // Dev fallback (auth disabled), scoped to the page's workspace
  if (!workspaceId || !userId) {
    const dev = await devFallbackContext(req.headers.get("x-workspace-slug"));
    if (dev) { workspaceId = dev.workspaceId; userId = dev.userId; role = dev.role; }
  }

  if (!workspaceId || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve business from workspace if not already set
  if (!businessId && workspaceId) {
    try {
      const [ws] = await db
        .select()
        .from(schema.workspaces)
        .where(eq(schema.workspaces.id, workspaceId));
      if (ws?.businessId) {
        businessId = ws.businessId;
        const [biz] = await db
          .select()
          .from(schema.businesses)
          .where(eq(schema.businesses.id, ws.businessId));
        if (biz) businessSlug = biz.slug;
      }
    } catch {}
  }

  return handler({
    workspaceId,
    userId,
    role: role || "member",
    businessId: businessId || null,
    businessSlug: businessSlug || null,
  });
}
