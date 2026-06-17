import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and, asc } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const [q] = await db.select().from(schema.quotes)
      .where(and(eq(schema.quotes.id, id), eq(schema.quotes.workspaceId, workspaceId)));
    if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const lineItems = await db.select().from(schema.quoteLineItems)
      .where(eq(schema.quoteLineItems.quoteId, id)).orderBy(asc(schema.quoteLineItems.displayOrder));
    return NextResponse.json({ data: { ...q, lineItems } });
  });
}

// PATCH — typically status changes (draft → sent → accepted/declined)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const body = await req.json();
    const patch: Record<string, any> = { updatedAt: new Date() };
    for (const k of ["name","status","notes","dealId","contactId","companyId"]) if (k in body) patch[k] = body[k];
    const [item] = await db.update(schema.quotes).set(patch)
      .where(and(eq(schema.quotes.id, id), eq(schema.quotes.workspaceId, workspaceId))).returning();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: item });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    await db.delete(schema.quotes).where(and(eq(schema.quotes.id, id), eq(schema.quotes.workspaceId, workspaceId)));
    return NextResponse.json({ data: { success: true } });
  });
}
