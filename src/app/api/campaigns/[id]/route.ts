import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const [c] = await db.select().from(schema.campaigns)
      .where(and(eq(schema.campaigns.id, id), eq(schema.campaigns.workspaceId, workspaceId)));
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const members = await db.select().from(schema.campaignMembers).where(eq(schema.campaignMembers.campaignId, id));
    return NextResponse.json({ data: { ...c, members } });
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const body = await req.json();
    const patch: Record<string, any> = { updatedAt: new Date() };
    for (const k of ["name","type","status","description","budgetedCost","actualCost","expectedRevenue"]) if (k in body) patch[k] = body[k];
    const [item] = await db.update(schema.campaigns).set(patch)
      .where(and(eq(schema.campaigns.id, id), eq(schema.campaigns.workspaceId, workspaceId))).returning();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: item });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    await db.delete(schema.campaigns).where(and(eq(schema.campaigns.id, id), eq(schema.campaigns.workspaceId, workspaceId)));
    return NextResponse.json({ data: { success: true } });
  });
}
