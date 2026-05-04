import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const pipelines = await db.select().from(schema.pipelines).where(eq(schema.pipelines.workspaceId, workspaceId)).orderBy(schema.pipelines.displayOrder);
    const out = [];
    for (const p of pipelines) {
      const stages = await db.select().from(schema.pipelineStages).where(eq(schema.pipelineStages.pipelineId, p.id)).orderBy(schema.pipelineStages.displayOrder);
      out.push({ ...p, stages });
    }
    return NextResponse.json({ data: out });
  });
}

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const body = await req.json();
    const [pipeline] = await db.insert(schema.pipelines).values({ ...body, workspaceId }).returning();
    const defaultStages = ["New Lead", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
    const probs = [10, 25, 50, 75, 100, 0];
    for (let i = 0; i < defaultStages.length; i++) {
      await db.insert(schema.pipelineStages).values({ pipelineId: pipeline.id, name: defaultStages[i], displayOrder: i, winProbability: probs[i] });
    }
    const stages = await db.select().from(schema.pipelineStages).where(eq(schema.pipelineStages.pipelineId, pipeline.id)).orderBy(schema.pipelineStages.displayOrder);
    return NextResponse.json({ data: { ...pipeline, stages } });
  });
}
