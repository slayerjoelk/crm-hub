import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const [item] = await db.select().from(schema.contacts).where(and(eq(schema.contacts.id, id), eq(schema.contacts.workspaceId, workspaceId)));
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    let company = null;
    if (item.companyId) {
      const [c] = await db.select().from(schema.companies).where(and(eq(schema.companies.id, item.companyId), eq(schema.companies.workspaceId, workspaceId)));
      company = c ?? null;
    }
    return NextResponse.json({ data: { ...item, company } });
  });
}

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
    const [item] = await db.update(schema.contacts).set(body).where(and(eq(schema.contacts.id, id), eq(schema.contacts.workspaceId, workspaceId))).returning();
    return NextResponse.json({ data: item });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    await db.delete(schema.contacts).where(and(eq(schema.contacts.id, id), eq(schema.contacts.workspaceId, workspaceId)));
    return NextResponse.json({ data: { success: true } });
  });
}
