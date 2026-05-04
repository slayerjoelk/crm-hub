import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; stageId: string }> }) {
  return withWorkspace(req, async () => {
    const { id: pipelineId, stageId } = await params;
    const body = await req.json();
    const [item] = await db.update(schema.pipelineStages).set(body).where(and(eq(schema.pipelineStages.id, stageId), eq(schema.pipelineStages.pipelineId, pipelineId))).returning();
    return NextResponse.json({ data: item });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; stageId: string }> }) {
  return withWorkspace(req, async () => {
    const { id: pipelineId, stageId } = await params;
    await db.delete(schema.pipelineStages).where(and(eq(schema.pipelineStages.id, stageId), eq(schema.pipelineStages.pipelineId, pipelineId)));
    return NextResponse.json({ data: { success: true } });
  });
}
