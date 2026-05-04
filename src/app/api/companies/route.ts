import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    let list = await db.select().from(schema.companies).where(eq(schema.companies.workspaceId, workspaceId)).orderBy(desc(schema.companies.createdAt));
    if (q) {
      const lower = q.toLowerCase();
      list = list.filter(c => (c.name||"").toLowerCase().includes(lower)||(c.domain||"").toLowerCase().includes(lower)||(c.industry||"").toLowerCase().includes(lower));
    }
    return NextResponse.json({ data: list });
  });
}

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const body = await req.json();
    const [item] = await db.insert(schema.companies).values({ ...body, workspaceId }).returning();
    await db.insert(schema.activities).values({ workspaceId, userId: "system", type: "contact_created", companyId: item.id, body: `Company "${item.name}" created.` });
    return NextResponse.json({ data: item });
  });
}
