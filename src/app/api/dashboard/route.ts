import { db, schema } from "../../../lib/db";
import { eq, and, desc, like, sql, count } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { withWorkspace } from "../../../lib/middleware";

// GET /api/dashboard
export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [contactCount] = await db
      .select({ value: count() })
      .from(schema.contacts)
      .where(eq(schema.contacts.workspaceId, workspaceId));

    const [companyCount] = await db
      .select({ value: count() })
      .from(schema.companies)
      .where(eq(schema.companies.workspaceId, workspaceId));

    const [dealCount] = await db
      .select({ value: count() })
      .from(schema.deals)
      .where(eq(schema.deals.workspaceId, workspaceId));

    const [wonDeals] = await db
      .select({ value: sql`COALESCE(SUM(${schema.deals.value}), 0)` })
      .from(schema.deals)
      .where(
        and(
          eq(schema.deals.workspaceId, workspaceId),
          eq(schema.deals.status, "won")
        )
      );

    const [openDeals] = await db
      .select({ value: sql`COALESCE(SUM(${schema.deals.value}), 0)` })
      .from(schema.deals)
      .where(
        and(
          eq(schema.deals.workspaceId, workspaceId),
          eq(schema.deals.status, "open")
        )
      );

    const recentDeals = await db
      .select()
      .from(schema.deals)
      .where(eq(schema.deals.workspaceId, workspaceId))
      .orderBy(desc(schema.deals.updatedAt))
      .limit(10);

    const recentActivities = await db
      .select()
      .from(schema.activities)
      .where(eq(schema.activities.workspaceId, workspaceId))
      .orderBy(desc(schema.activities.createdAt))
      .limit(20);

    return NextResponse.json({
      stats: {
        contacts: Number(contactCount.value) ?? 0,
        companies: Number(companyCount.value) ?? 0,
        deals: Number(dealCount.value) ?? 0,
        revenueWon: Number(Object.values(wonDeals)[0]) ?? 0,
        revenueOpen: Number(Object.values(openDeals)[0]) ?? 0,
      },
      deals: recentDeals,
      activities: recentActivities,
    });
  });
}
