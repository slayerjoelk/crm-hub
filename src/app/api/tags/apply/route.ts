import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and, inArray } from "drizzle-orm";

// POST /api/tags/apply — attach tags to an entity
export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const body = await req.json().catch(() => ({}));
    const entityType = body.entityType;
    const entityId = body.entityId;
    const tagIds: string[] = body.tagIds || [];

    if (!["contact", "company", "deal"].includes(entityType) || !entityId) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    // Verify tags belong to this workspace
    const wsTags = await db
      .select({ id: schema.tags.id })
      .from(schema.tags)
      .where(and(eq(schema.tags.workspaceId, workspaceId), inArray(schema.tags.id, tagIds)));

    const validIds = wsTags.map(t => t.id);

    for (const tagId of validIds) {
      await db
        .insert(schema.tagRelations)
        .values({ tagId, entityType, entityId })
        .onConflictDoNothing();
    }

    return NextResponse.json({ ok: true, applied: validIds.length });
  });
}

// DELETE /api/tags/apply — remove tags from an entity
export async function DELETE(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const body = await req.json().catch(() => ({}));
    const entityType = body.entityType;
    const entityId = body.entityId;
    const tagIds: string[] = body.tagIds || [];

    if (!["contact", "company", "deal"].includes(entityType) || !entityId) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    const validTagIds = tagIds.length
      ? tagIds
      : (await db
          .select({ tagId: schema.tagRelations.tagId })
          .from(schema.tagRelations)
          .where(and(eq(schema.tagRelations.entityType, entityType), eq(schema.tagRelations.entityId, entityId)))
          .then(rows => rows.map(r => r.tagId)));

    for (const tagId of validTagIds) {
      await db
        .delete(schema.tagRelations)
        .where(
          and(
            eq(schema.tagRelations.tagId, tagId),
            eq(schema.tagRelations.entityType, entityType),
            eq(schema.tagRelations.entityId, entityId),
          ),
        );
    }

    return NextResponse.json({ ok: true });
  });
}
