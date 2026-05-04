import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    const companyId = searchParams.get("companyId");
    let list = await db.select().from(schema.deals).where(eq(schema.deals.workspaceId, workspaceId)).orderBy(desc(schema.deals.updatedAt));
    if (contactId) list = list.filter(d => d.primaryContactId === contactId);
    if (companyId) list = list.filter(d => d.companyId === companyId);
    return NextResponse.json({ data: list });
  });
}

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const body = await req.json();
    const stageId = body.stageId;
    let probability = body.probability ?? body.stageProbability ?? 0;
    if (stageId && !body.probability && !body.stageProbability) {
      const [stage] = await db.select().from(schema.pipelineStages).where(eq(schema.pipelineStages.id, stageId));
      probability = stage?.winProbability ?? 0;
    }
    const insertValues: any = {
      workspaceId,
      status: body.status || "open",
      name: body.name,
      value: body.amount ?? body.value ?? 0,
      currency: body.currency || "USD",
      stageId,
      pipelineId: body.pipelineId,
      primaryContactId: body.contactId || body.primaryContactId || null,
      expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
      probability,
    };
    if (body.description) insertValues.description = body.description;
    if (body.companyId) insertValues.companyId = body.companyId;
    const [item] = await db.insert(schema.deals).values(insertValues).returning();
    await db.insert(schema.activities).values({ workspaceId, userId: "system", type: "deal_created", dealId: item.id, body: `Deal "${item.name}" created.` });
    return NextResponse.json({ data: item });
  });
}
