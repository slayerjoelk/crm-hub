import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and } from "drizzle-orm";

async function verifyStage(
  stageId: string,
  workspaceId: string
): Promise<{ stage: typeof schema.pipelineStages.$inferSelect; pipeline: typeof schema.pipelines.$inferSelect } | null> {
  const [stage] = await db.select().from(schema.pipelineStages).where(eq(schema.pipelineStages.id, stageId)).limit(1);
  if (!stage) return null;
  const [pipeline] = await db
    .select()
    .from(schema.pipelines)
    .where(and(eq(schema.pipelines.id, stage.pipelineId), eq(schema.pipelines.workspaceId, workspaceId)))
    .limit(1);
  if (!pipeline) return null;
  return { stage, pipeline };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; stageId: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const { stageId } = await params;
    const result = await verifyStage(stageId, workspaceId);
    if (!result) return NextResponse.json({ error: "Stage not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const updates: any = { updatedAt: new Date() };
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description || null;
    if (body.color !== undefined) updates.color = body.color;
    if (body.winProbability !== undefined) updates.winProbability = body.winProbability;

    const [updated] = await db
      .update(schema.pipelineStages)
      .set(updates)
      .where(eq(schema.pipelineStages.id, stageId))
      .returning();

    return NextResponse.json({ data: updated });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; stageId: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const { stageId } = await params;
    const result = await verifyStage(stageId, workspaceId);
    if (!result) return NextResponse.json({ error: "Stage not found" }, { status: 404 });

    // Reorder any stages after this one
    const stages = await db
      .select()
      .from(schema.pipelineStages)
      .where(eq(schema.pipelineStages.pipelineId, result.pipeline.id))
      .orderBy(schema.pipelineStages.displayOrder);

    const deletedOrder = result.stage.displayOrder;
    await db.delete(schema.pipelineStages).where(eq(schema.pipelineStages.id, stageId));

    for (const s of stages) {
      if (s.displayOrder > deletedOrder) {
        await db
          .update(schema.pipelineStages)
          .set({ displayOrder: s.displayOrder - 1 })
          .where(eq(schema.pipelineStages.id, s.id));
      }
    }

    return NextResponse.json({ success: true });
  });
}
