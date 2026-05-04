import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and } from "drizzle-orm";

// DELETE /api/tags/[id] — delete a tag and its relations
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  return withWorkspace(req, async ({ workspaceId }) => {
    // Verify tag belongs to workspace
    const [tag] = await db
      .select()
      .from(schema.tags)
      .where(and(eq(schema.tags.id, id), eq(schema.tags.workspaceId, workspaceId)))
      .limit(1);

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Cascade delete relations
    await db.delete(schema.tagRelations).where(eq(schema.tagRelations.tagId, id));
    await db.delete(schema.tags).where(eq(schema.tags.id, id));

    return NextResponse.json({ ok: true });
  });
}
