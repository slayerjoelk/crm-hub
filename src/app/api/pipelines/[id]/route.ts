import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const { id } = await params;
    const [pipeline] = await db
      .select()
      .from(schema.pipelines)
      .where(and(eq(schema.pipelines.id, id), eq(schema.pipelines.workspaceId, workspaceId)))
      .limit(1);

    if (!pipeline) return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });

    const stages = await db
      .select()
      .from(schema.pipelineStages)
      .where(eq(schema.pipelineStages.pipelineId, id))
      .orderBy(schema.pipelineStages.displayOrder);

    return NextResponse.json({ data: { ...pipeline, stages } });
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const [pipeline] = await db
      .select()
      .from(schema.pipelines)
      .where(and(eq(schema.pipelines.id, id), eq(schema.pipelines.workspaceId, workspaceId)))
      .limit(1);
    if (!pipeline) return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });

    const updates: any = { updatedAt: new Date() };
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description || null;
    if (body.color !== undefined) updates.color = body.color;
    if (body.isDefault === true) {
      // Unset other defaults first
      await db
        .update(schema.pipelines)
        .set({ isDefault: false })
        .where(eq(schema.pipelines.workspaceId, workspaceId));
      updates.isDefault = true;
    } else if (body.isDefault === false) {
      updates.isDefault = false;
    }

    const [updated] = await db
      .update(schema.pipelines)
      .set(updates)
      .where(eq(schema.pipelines.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const { id } = await params;
    const [pipeline] = await db
      .select()
      .from(schema.pipelines)
      .where(and(eq(schema.pipelines.id, id), eq(schema.pipelines.workspaceId, workspaceId)))
      .limit(1);
    if (!pipeline) return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });

    await db.delete(schema.pipelineStages).where(eq(schema.pipelineStages.pipelineId, id));
    await db.delete(schema.pipelines).where(eq(schema.pipelines.id, id));

    // If deleted the default, set first remaining as default
    if (pipeline.isDefault) {
      const [first] = await db
        .select()
        .from(schema.pipelines)
        .where(eq(schema.pipelines.workspaceId, workspaceId))
        .limit(1);
      if (first) {
        await db.update(schema.pipelines).set({ isDefault: true }).where(eq(schema.pipelines.id, first.id));
      }
    }

    return NextResponse.json({ success: true });
  });
}
