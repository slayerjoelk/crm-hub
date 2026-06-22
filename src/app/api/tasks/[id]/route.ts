import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const [item] = await db.select().from(schema.tasks).where(and(eq(schema.tasks.id, id), eq(schema.tasks.workspaceId, workspaceId)));
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Related activities — those tied to THIS task's contact or deal (activities have no taskId).
    const all = await db.select().from(schema.activities)
      .where(eq(schema.activities.workspaceId, workspaceId)).orderBy(desc(schema.activities.createdAt));
    const activities = all.filter(a =>
      (item.contactId && a.contactId === item.contactId) ||
      (item.dealId && a.dealId === item.dealId)
    );
    return NextResponse.json({ data: { ...item, activities } });
  });
}

// Never let a client move a row to another workspace or overwrite identity columns
const PROTECTED = new Set(["id", "workspaceId", "createdAt"]);
function sanitize(body: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(body || {})) if (!PROTECTED.has(k)) out[k] = v;
  return out;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const body = sanitize(await req.json());
    const [item] = await db.update(schema.tasks).set(body).where(and(eq(schema.tasks.id, id), eq(schema.tasks.workspaceId, workspaceId))).returning();
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
