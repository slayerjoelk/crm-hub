import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const [item] = await db.select().from(schema.deals).where(and(eq(schema.deals.id, id), eq(schema.deals.workspaceId, workspaceId)));
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Get related activities
    const activities = await db.select().from(schema.activities).where(and(eq(schema.activities.dealId, item.id), eq(schema.activities.workspaceId, workspaceId))).orderBy(desc(schema.activities.createdAt));
    // Get related tasks
    const tasks = await db.select().from(schema.tasks).where(and(eq(schema.tasks.dealId, item.id), eq(schema.tasks.workspaceId, workspaceId))).orderBy(desc(schema.tasks.createdAt));
    return NextResponse.json({ data: { ...item, activities, tasks } });
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const body = await req.json();
    const [item] = await db.update(schema.deals).set(body).where(and(eq(schema.deals.id, id), eq(schema.deals.workspaceId, workspaceId))).returning();
    return NextResponse.json({ data: item });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    await db.delete(schema.deals).where(and(eq(schema.deals.id, id), eq(schema.deals.workspaceId, workspaceId)));
    return NextResponse.json({ data: { success: true } });
  });
}
