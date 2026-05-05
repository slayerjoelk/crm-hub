import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, desc, count } from "drizzle-orm";

const DEFAULT_STAGES = [
  { name: "Prospecting", winProbability: 10 },
  { name: "Qualification", winProbability: 25 },
  { name: "Proposal", winProbability: 50 },
  { name: "Negotiation", winProbability: 75 },
  { name: "Closed Won", winProbability: 100 },
];

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const rows = await db
      .select({
        id: schema.pipelines.id,
        workspaceId: schema.pipelines.workspaceId,
        name: schema.pipelines.name,
        description: schema.pipelines.description,
        type: schema.pipelines.type,
        isDefault: schema.pipelines.isDefault,
        color: schema.pipelines.color,
        displayOrder: schema.pipelines.displayOrder,
        createdAt: schema.pipelines.createdAt,
        updatedAt: schema.pipelines.updatedAt,
        stageCount: count(schema.pipelineStages.id),
      })
      .from(schema.pipelines)
      .leftJoin(schema.pipelineStages, eq(schema.pipelineStages.pipelineId, schema.pipelines.id))
      .where(eq(schema.pipelines.workspaceId, workspaceId))
      .groupBy(schema.pipelines.id)
      .orderBy(desc(schema.pipelines.displayOrder), desc(schema.pipelines.createdAt));

    return NextResponse.json({ data: rows });
  });
}

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const body = await req.json().catch(() => ({}));
    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Pipeline name is required" }, { status: 400 });
    }

    const name = body.name.trim();
    const [existing] = await db
      .select()
      .from(schema.pipelines)
      .where(eq(schema.pipelines.workspaceId, workspaceId))
      .limit(1);

    const [pipeline] = await db
      .insert(schema.pipelines)
      .values({
        workspaceId,
        name,
        description: body.description || null,
        type: body.type || "deal",
        color: body.color || "#4f46e5",
        displayOrder: 0,
        isDefault: !existing,
      })
      .returning();

    // Create stages
    const stageInputs = Array.isArray(body.stages) && body.stages.length > 0
      ? body.stages.map((s: any, idx: number) => ({
          pipelineId: pipeline.id,
          name: s.name,
          description: s.description || null,
          color: s.color || "#94a3b8",
          winProbability: s.winProbability ?? 0,
          displayOrder: idx,
          isArchived: false,
        }))
      : DEFAULT_STAGES.map((s, idx) => ({
          pipelineId: pipeline.id,
          name: s.name,
          description: null,
          color: "#94a3b8",
          winProbability: s.winProbability,
          displayOrder: idx,
          isArchived: false,
        }));

    await db.insert(schema.pipelineStages).values(stageInputs);

    const stages = await db
      .select()
      .from(schema.pipelineStages)
      .where(eq(schema.pipelineStages.pipelineId, pipeline.id))
      .orderBy(schema.pipelineStages.displayOrder);

    return NextResponse.json({ data: { ...pipeline, stages } });
  });
}
