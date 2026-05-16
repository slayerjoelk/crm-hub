import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
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
