import { db, schema } from "@/lib/db";
import { desc, eq, and } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { withWorkspace } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId, userId }) => {
    const rows = await db
      .select()
      .from(schema.notifications)
      .where(and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.workspaceId, workspaceId)
      ))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(50);
    return NextResponse.json({ success: true, data: rows });
  });
}

export async function PATCH(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId, userId }) => {
    const { id, read } = await req.json().catch(() => ({} as any));
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.update(schema.notifications)
      .set({ read: read !== undefined ? read : true })
      .where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, userId), eq(schema.notifications.workspaceId, workspaceId)));
    return NextResponse.json({ success: true });
  });
}
