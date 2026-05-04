import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId, userId }) => {
    const id = (await params).id;
    const body = await req.json();
    const [prev] = await db.select().from(schema.deals).where(and(eq(schema.deals.id, id), eq(schema.deals.workspaceId, workspaceId)));
    const [item] = await db.update(schema.deals).set(body).where(and(eq(schema.deals.id, id), eq(schema.deals.workspaceId, workspaceId))).returning();
    if (prev && body.stageId && prev.stageId !== body.stageId) {
      const [oldStage] = await db.select().from(schema.pipelineStages).where(eq(schema.pipelineStages.id, prev.stageId));
      const [newStage] = await db.select().from(schema.pipelineStages).where(eq(schema.pipelineStages.id, body.stageId));
      await db.insert(schema.activities).values({ workspaceId, userId: userId || "system", type: "deal_stage_change", dealId: id, body: `Deal moved from "${oldStage?.name ?? ""}" to "${newStage?.name ?? ""}"` });
    }
    return NextResponse.json({ data: item });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    await db.delete(schema.deals).where(and(eq(schema.deals.id, id), eq(schema.deals.workspaceId, workspaceId)));
    return NextResponse.json({ data: { success: true } });
  });
}
