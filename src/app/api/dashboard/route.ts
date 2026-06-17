import { db, schema } from "@/lib/db";
import { eq, and, desc, like, sql, count, gte } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { withWorkspace } from "@/lib/middleware";

// GET /api/dashboard
export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // ── COUNT HELPERS ──
    function countBetween(table: any, col: any, from: Date, to: Date) {
      return db
        .select({ value: count() })
        .from(table)
        .where(and(
          eq(col, workspaceId),
          gte(table.createdAt, from),
          sql`${table.createdAt} < ${to}`
        ));
    }

    function sumBetween(from: Date, to: Date) {
      return db
        .select({ value: sql`COALESCE(SUM(${schema.deals.value}), 0)` })
        .from(schema.deals)
        .where(and(
          eq(schema.deals.workspaceId, workspaceId),
          eq(schema.deals.status, "won"),
          gte(schema.deals.createdAt, from),
          sql`${schema.deals.createdAt} < ${to}`
        ));
    }

    // This month counts
    const [[contactsThisMonth], [companiesThisMonth], [dealsThisMonth], [revenueThisMonth]] = await Promise.all([
      countBetween(schema.contacts, schema.contacts.workspaceId, startOfMonth, now),
      countBetween(schema.companies, schema.companies.workspaceId, startOfMonth, now),
      countBetween(schema.deals, schema.deals.workspaceId, startOfMonth, now),
      sumBetween(startOfMonth, now),
    ]);

    // Last month counts
    const [[contactsLastMonth], [companiesLastMonth], [dealsLastMonth], [revenueLastMonth]] = await Promise.all([
      countBetween(schema.contacts, schema.contacts.workspaceId, startOfLastMonth, startOfMonth),
      countBetween(schema.companies, schema.companies.workspaceId, startOfLastMonth, startOfMonth),
      countBetween(schema.deals, schema.deals.workspaceId, startOfLastMonth, startOfMonth),
      sumBetween(startOfLastMonth, startOfMonth),
    ]);

    // Month-over-month change in NEW records. Returns null when there's no
    // current-month activity — a total with zero new this month shouldn't read
    // as "-100%". The UI hides the chip on null.
    const pct = (thisVal: number, lastVal: number): number | null => {
      if (thisVal === 0) return null;
      if (lastVal === 0) return 100;
      return Math.round(((thisVal - lastVal) / lastVal) * 100);
    };

    const trends = {
      contacts: pct(Number(contactsThisMonth.value ?? 0), Number(contactsLastMonth.value ?? 0)),
      companies: pct(Number(companiesThisMonth.value ?? 0), Number(companiesLastMonth.value ?? 0)),
      deals: pct(Number(dealsThisMonth.value ?? 0), Number(dealsLastMonth.value ?? 0)),
      revenue: pct(Number(Object.values(revenueThisMonth as any)[0] ?? 0), Number(Object.values(revenueLastMonth as any)[0] ?? 0)),
    };

    // ── TOTAL COUNTS ──
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
      .where(and(eq(schema.deals.workspaceId, workspaceId), eq(schema.deals.status, "won")));

    const [openDeals] = await db
      .select({ value: sql`COALESCE(SUM(${schema.deals.value}), 0)` })
      .from(schema.deals)
      .where(and(eq(schema.deals.workspaceId, workspaceId), eq(schema.deals.status, "open")));

    const wonDealsValue = Number(wonDeals?.value ?? 0);
    const openDealsValue = Number(openDeals?.value ?? 0);

    // ── MONTHLY REVENUE (last 12 months, open+won deals) ──
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthlyRows = await db
      .select({
        month: sql`strftime('%Y-%m', ${schema.deals.createdAt} / 1000, 'unixepoch')`,
        total: sql`COALESCE(SUM(${schema.deals.value}), 0)`,
      })
      .from(schema.deals)
      .where(and(
        eq(schema.deals.workspaceId, workspaceId),
        gte(schema.deals.createdAt, twelveMonthsAgo),
        sql`${schema.deals.status} IN ('open', 'won')`
      ))
      .groupBy(sql`strftime('%Y-%m', ${schema.deals.createdAt} / 1000, 'unixepoch')`)
      .orderBy(sql`strftime('%Y-%m', ${schema.deals.createdAt} / 1000, 'unixepoch')`);

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlyMap = new Map<string, number>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      monthlyMap.set(key, 0);
    }
    for (const row of monthlyRows as any[]) {
      monthlyMap.set(row.month, Number(row.total) || 0);
    }
    const chartData = Array.from(monthlyMap.entries()).map(([month, revenue]) => {
      const [y, m] = month.split("-");
      return { name: monthNames[Number(m)-1], revenue };
    });

    // Get the default pipeline first
    const [defaultPipeline] = await db
      .select()
      .from(schema.pipelines)
      .where(and(eq(schema.pipelines.workspaceId, workspaceId), eq(schema.pipelines.isDefault, true)))
      .limit(1);

    let pipelineData: { name: string; value: number }[] = [];
    if (defaultPipeline) {
      const stageRows = await db
        .select({
          stageId: schema.deals.stageId,
          total: sql`COALESCE(SUM(${schema.deals.value}), 0)`,
        })
        .from(schema.deals)
        .where(and(eq(schema.deals.workspaceId, workspaceId), eq(schema.deals.status, "open")))
        .groupBy(schema.deals.stageId);

      const stagesMap = new Map<string, string>();
      const allStages = await db
        .select()
        .from(schema.pipelineStages)
        .where(eq(schema.pipelineStages.pipelineId, defaultPipeline.id));
      for (const s of allStages) stagesMap.set(s.id, s.name);

      pipelineData = stageRows.map((r) => ({
        name: stagesMap.get(r.stageId ?? "") ?? "Unknown",
        value: Number(r.total) || 0,
      }));
      if (pipelineData.length === 0) {
        pipelineData = [{ name: "No open deals", value: 1 }];
      }
    } else {
      pipelineData = [{ name: "No pipeline", value: 1 }];
    }

    // ── RECENT LISTS ──
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
      trends,
      monthlyRevenue: chartData,
      pipelineDistribution: pipelineData,
      deals: recentDeals,
      activities: recentActivities,
    });
  });
}
