import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const body = await req.json();
    const updates: any = { ...body };
    if (body.status === "done") updates.completedAt = new Date();
    const [item] = await db.update(schema.tasks).set(updates).where(and(eq(schema.tasks.id, id), eq(schema.tasks.workspaceId, workspaceId))).returning();
    return NextResponse.json({ data: item });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    await db.delete(schema.tasks).where(and(eq(schema.tasks.id, id), eq(schema.tasks.workspaceId, workspaceId)));
    return NextResponse.json({ data: { success: true } });
  });
}
