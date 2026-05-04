import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const list = await db.select().from(schema.deals).where(eq(schema.deals.workspaceId, workspaceId)).orderBy(desc(schema.deals.updatedAt));
    return NextResponse.json({ data: list });
  });
}

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const body = await req.json();
    const [item] = await db.insert(schema.deals).values({ ...body, workspaceId, status: body.status || "open" }).returning();
    await db.insert(schema.activities).values({ workspaceId, userId: "system", type: "deal_created", dealId: item.id, body: `Deal "${item.name}" created.` });
    return NextResponse.json({ data: item });
  });
}
