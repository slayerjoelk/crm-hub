import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const [item] = await db.select().from(schema.leads)
      .where(and(eq(schema.leads.id, id), eq(schema.leads.workspaceId, workspaceId)));
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const activities = await db.select().from(schema.activities)
      .where(and(eq(schema.activities.workspaceId, workspaceId), eq(schema.activities.contactId, id)))
      .orderBy(desc(schema.activities.createdAt));
    return NextResponse.json({ data: { ...item, activities } });
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const body = await req.json();
    const patch: Record<string, any> = { updatedAt: new Date() };
    for (const k of ["firstName","lastName","email","phone","jobTitle","company","website","industry","employeeCount","annualRevenue","status","rating","source","sourceDetail","city","state","country","linkedinUrl","notes","leadScore"]) {
      if (k in body) patch[k] = body[k];
    }
    const [item] = await db.update(schema.leads).set(patch)
      .where(and(eq(schema.leads.id, id), eq(schema.leads.workspaceId, workspaceId))).returning();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: item });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    await db.delete(schema.leads).where(and(eq(schema.leads.id, id), eq(schema.leads.workspaceId, workspaceId)));
    return NextResponse.json({ data: { success: true } });
  });
}
