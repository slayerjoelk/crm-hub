import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const [item] = await db
        .update(schema.customProperties)
        .set(body)
        .where(eq(schema.customProperties.id, id))
        .returning();
      return NextResponse.json({ data: item });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to update custom field" }, { status: 500 });
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const { id } = await params;
      await db.delete(schema.customProperties).where(eq(schema.customProperties.id, id));
      return NextResponse.json({ success: true });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to delete custom field" }, { status: 500 });
    }
  });
}
