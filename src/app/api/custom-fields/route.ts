import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const { searchParams } = new URL(req.url);
      const entityType = searchParams.get("entityType");
      let list = await db
        .select()
        .from(schema.customProperties)
        .where(eq(schema.customProperties.workspaceId, workspaceId))
        .orderBy(desc(schema.customProperties.displayOrder));
      if (entityType) list = list.filter(p => p.entityType === entityType);
      return NextResponse.json({ data: list });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to load custom fields" }, { status: 500 });
    }
  });
}

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const body = await req.json();
      const data = { ...body, workspaceId };
      if (!data.label || !data.name || !data.type || !data.entityType) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      // auto-generate snake_case name from label if not provided
      if (!data.name) data.name = data.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
      const [item] = await db.insert(schema.customProperties).values(data).returning();
      return NextResponse.json({ data: item });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to create custom field" }, { status: 500 });
    }
  });
}
