import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    let list = await db.select().from(schema.tasks).where(eq(schema.tasks.workspaceId, workspaceId)).orderBy(desc(schema.tasks.createdAt));
    if (status) list = list.filter(t => t.status === status);
    return NextResponse.json({ data: list });
  });
}

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const body = await req.json();
    const [item] = await db.insert(schema.tasks).values({ ...body, workspaceId, status: body.status || "todo", priority: body.priority || "medium" }).returning();
    return NextResponse.json({ data: item });
  });
}
