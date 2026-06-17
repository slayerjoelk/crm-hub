import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const body = await req.json();
    const patch: Record<string, any> = { updatedAt: new Date() };
    for (const k of ["subject","description","status","priority","type","origin","contactId","companyId"]) if (k in body) patch[k] = body[k];
    if (body.status === "closed") patch.resolvedAt = new Date();
    const [item] = await db.update(schema.cases).set(patch)
      .where(and(eq(schema.cases.id, id), eq(schema.cases.workspaceId, workspaceId))).returning();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: item });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    await db.delete(schema.cases).where(and(eq(schema.cases.id, id), eq(schema.cases.workspaceId, workspaceId)));
    return NextResponse.json({ data: { success: true } });
  });
}
