import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and, desc, sql, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    // All-time revenue (won deals)
    const [rev] = await db
      .select({ value: sql`COALESCE(SUM(${schema.deals.value}), 0)` })
      .from(schema.deals)
      .where(and(
        eq(schema.deals.workspaceId, workspaceId),
        eq(schema.deals.status, "won")
      ));

    // Active deal count
    const [activeDeals] = await db
      .select({ value: count() })
      .from(schema.deals)
      .where(and(
        eq(schema.deals.workspaceId, workspaceId),
        eq(schema.deals.status, "open")
      ));

    // Contact count
    const [contactCount] = await db
      .select({ value: count() })
      .from(schema.contacts)
      .where(eq(schema.contacts.workspaceId, workspaceId));

    // Pipeline distribution
    const pipelines = await db
      .select()
      .from(schema.pipelines)
      .where(eq(schema.pipelines.workspaceId, workspaceId));

    const pipelineDistribution: { name: string; value: number }[] = [];
    for (const p of pipelines) {
      const [d] = await db
        .select({ value: count() })
        .from(schema.deals)
        .where(and(eq(schema.deals.workspaceId, workspaceId), eq(schema.deals.pipelineId, p.id)));
      pipelineDistribution.push({ name: p.name, value: Number(d.value ?? 0) });
    }

    // Top deals by value
    const topDeals = await db
      .select()
      .from(schema.deals)
      .where(eq(schema.deals.workspaceId, workspaceId))
      .orderBy(desc(schema.deals.value))
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        revenue: Number((rev as any).value ?? 0),
        dealCount: Number(activeDeals.value ?? 0),
        contactCount: Number(contactCount.value ?? 0),
        pipelineDistribution,
        topDeals: topDeals.map(d => ({
          id: d.id,
          name: d.name,
          value: d.value,
          currency: d.currency,
        })),
      },
    });
  });
}
