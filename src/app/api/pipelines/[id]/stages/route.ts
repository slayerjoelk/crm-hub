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

    return NextResponse.json({ data: stages });
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const { id } = await params;
    const [pipeline] = await db
      .select()
      .from(schema.pipelines)
      .where(and(eq(schema.pipelines.id, id), eq(schema.pipelines.workspaceId, workspaceId)))
      .limit(1);
    if (!pipeline) return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Stage name is required" }, { status: 400 });
    }

    // Get max order
    const existing = await db
      .select()
      .from(schema.pipelineStages)
      .where(eq(schema.pipelineStages.pipelineId, id))
      .orderBy(schema.pipelineStages.displayOrder);

    const [stage] = await db
      .insert(schema.pipelineStages)
      .values({
        pipelineId: id,
        name: body.name.trim(),
        description: body.description || null,
        color: body.color || "#94a3b8",
        winProbability: body.winProbability ?? 0,
        displayOrder: existing.length > 0 ? existing[existing.length - 1].displayOrder + 1 : 0,
        isArchived: false,
      })
      .returning();

    return NextResponse.json({ data: stage });
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const { id } = await params;
    const [pipeline] = await db
      .select()
      .from(schema.pipelines)
      .where(and(eq(schema.pipelines.id, id), eq(schema.pipelines.workspaceId, workspaceId)))
      .limit(1);
    if (!pipeline) return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    if (!Array.isArray(body.stageIds) || body.stageIds.length === 0) {
      return NextResponse.json({ error: "stageIds array required" }, { status: 400 });
    }

    // Verify all stages belong to this pipeline
    const stages = await db
      .select()
      .from(schema.pipelineStages)
      .where(eq(schema.pipelineStages.pipelineId, id));

    const stageMap = new Map(stages.map(s => [s.id, s]));
    for (const sid of body.stageIds) {
      if (!stageMap.has(sid)) {
        return NextResponse.json({ error: `Stage ${sid} not found in pipeline` }, { status: 400 });
      }
    }

    // Reorder
    for (let i = 0; i < body.stageIds.length; i++) {
      await db
        .update(schema.pipelineStages)
        .set({ displayOrder: i })
        .where(eq(schema.pipelineStages.id, body.stageIds[i]));
    }

    const updated = await db
      .select()
      .from(schema.pipelineStages)
      .where(eq(schema.pipelineStages.pipelineId, id))
      .orderBy(schema.pipelineStages.displayOrder);

    return NextResponse.json({ data: updated });
  });
}
