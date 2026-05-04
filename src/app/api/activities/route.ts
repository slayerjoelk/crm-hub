import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const q = searchParams.get("q");
    let list = await db.select().from(schema.activities).where(eq(schema.activities.workspaceId, workspaceId)).orderBy(desc(schema.activities.createdAt));
    if (entityType && entityId) {
      list = list.filter(a => {
        if (entityType === "contact" && a.contactId === entityId) return true;
        if (entityType === "deal" && a.dealId === entityId) return true;
        if (entityType === "company" && a.companyId === entityId) return true;
        return false;
      });
    }
    if (q) {
      const lower = q.toLowerCase();
      list = list.filter(a => (a.body || "").toLowerCase().includes(lower) || (a.subject || "").toLowerCase().includes(lower));
    }
    return NextResponse.json({ data: list });
  });
}

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId, userId }) => {
    const body = await req.json();
    const [item] = await db.insert(schema.activities).values({ ...body, workspaceId, userId: userId || "system" }).returning();
    return NextResponse.json({ data: item });
  });
}
