import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and } from "drizzle-orm";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ workspaceId: string; id: string }> }) {
  return withWorkspace(req, async ({ workspaceId, userId, role }) => {
    const { workspaceId: wsSlug, id } = await params;
    // Only owners/admins can remove members
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Prevent self-delete or owner deletion by non-owner
    const [target] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (target.role === "owner" && role !== "owner") {
      return NextResponse.json({ error: "Only owner can remove owner" }, { status: 403 });
    }
    await db.delete(schema.users).where(and(eq(schema.users.id, id), eq(schema.users.workspaceId, workspaceId)));
    return NextResponse.json({ success: true });
  });
}
