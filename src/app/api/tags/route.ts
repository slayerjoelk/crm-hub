import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and, inArray, sql } from "drizzle-orm";

// GET /api/tags — list all tags for workspace OR tags for a specific entity
// ?entityType=contact|company|deal&entityId=xxx  returns tags attached to that entity
export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const url = new URL(req.url);
    const entityType = url.searchParams.get("entityType") as "contact" | "company" | "deal" | null;
    const entityId = url.searchParams.get("entityId");

    // Entity-specific tags
    if (entityType && entityId) {
      const rows = await db
        .select({
          id: schema.tags.id,
          name: schema.tags.name,
          color: schema.tags.color,
          createdAt: schema.tags.createdAt,
        })
        .from(schema.tags)
        .innerJoin(
          schema.tagRelations,
          and(
            eq(schema.tagRelations.tagId, schema.tags.id),
            eq(schema.tagRelations.entityType, entityType),
            eq(schema.tagRelations.entityId, entityId),
          ),
        )
        .where(eq(schema.tags.workspaceId, workspaceId))
        .orderBy(schema.tags.name);
      return NextResponse.json({ data: rows });
    }

    // All workspace tags with usage count
    const data = await db
      .select({
        id: schema.tags.id,
        name: schema.tags.name,
        color: schema.tags.color,
        createdAt: schema.tags.createdAt,
        useCount: sql<number>`(
          select count(*) from tag_relations where tag_id = ${schema.tags.id}
        )`.as("use_count"),
      })
      .from(schema.tags)
      .where(eq(schema.tags.workspaceId, workspaceId))
      .orderBy(schema.tags.name);

    return NextResponse.json({ data });
  });
}

// POST /api/tags — create a new tag
export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const body = await req.json();
    const name = (body.name || "").trim();
    const color = (body.color || "#3b82f6").trim();

    if (!name) {
      return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
    }

    // upsert on name collision
    const existing = await db
      .select()
      .from(schema.tags)
      .where(and(eq(schema.tags.workspaceId, workspaceId), eq(schema.tags.name, name)))
      .limit(1);

    if (existing.length) {
      return NextResponse.json({ data: existing[0] });
    }

    const [tag] = await db
      .insert(schema.tags)
      .values({ workspaceId, name, color })
      .returning();

    return NextResponse.json({ data: tag });
  });
}
