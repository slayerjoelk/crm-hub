import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const [item] = await db.select().from(schema.companies).where(and(eq(schema.companies.id, id), eq(schema.companies.workspaceId, workspaceId)));
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Get linked contacts
    const contacts = await db.select().from(schema.contacts).where(and(eq(schema.contacts.companyId, item.id), eq(schema.contacts.workspaceId, workspaceId)));
    return NextResponse.json({ data: { ...item, contacts } });
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const body = await req.json();
    const [item] = await db.update(schema.companies).set(body).where(and(eq(schema.companies.id, id), eq(schema.companies.workspaceId, workspaceId))).returning();
    return NextResponse.json({ data: item });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    await db.delete(schema.companies).where(and(eq(schema.companies.id, id), eq(schema.companies.workspaceId, workspaceId)));
    return NextResponse.json({ data: { success: true } });
  });
}
