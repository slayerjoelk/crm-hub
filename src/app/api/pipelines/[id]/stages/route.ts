import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async () => {
    const id = (await params).id;
    const stages = await db.select().from(schema.pipelineStages).where(eq(schema.pipelineStages.pipelineId, id)).orderBy(schema.pipelineStages.displayOrder);
    return NextResponse.json({ data: stages });
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async () => {
    const id = (await params).id;
    const body = await req.json();
    const [item] = await db.insert(schema.pipelineStages).values({ ...body, pipelineId: id }).returning();
    return NextResponse.json({ data: item });
  });
}
