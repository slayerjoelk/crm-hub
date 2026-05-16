import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { eq, inArray, sql, count } from "drizzle-orm";

// GET /api/owner/dashboard
// Owner-only cross-business aggregated metrics
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "owner") {
      return NextResponse.json({ error: "Forbidden — owner only" }, { status: 403 });
    }

    // Find all workspaces for this user
    const userWorkspaces = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, payload.userId));

    const workspaceIds = userWorkspaces.map(u => u.workspaceId);
    if (workspaceIds.length === 0) {
      return NextResponse.json({
        stats: { totalContacts: 0, totalDeals: 0, totalTasks: 0, combinedMRR: 0, leadsThisMonth: 0 },
        businesses: [],
        recentActivity: [],
      });
    }

    const workspaces = await db
      .select()
      .from(schema.workspaces)
      .where(inArray(schema.workspaces.id, workspaceIds));

    // Group workspaces by business
    const bizIds = workspaces.map(w => w.businessId).filter(Boolean) as string[];
    const businesses = bizIds.length
      ? await db.select().from(schema.businesses).where(inArray(schema.businesses.id, bizIds))
      : [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // ── TOTAL COUNTS ──
    const [contactCount] = await db
      .select({ value: count() })
      .from(schema.contacts)
      .where(inArray(schema.contacts.workspaceId, workspaceIds));

    const [dealCount] = await db
      .select({ value: count() })
      .from(schema.deals)
      .where(inArray(schema.deals.workspaceId, workspaceIds));

    const [taskCount] = await db
      .select({ value: count() })
      .from(schema.tasks)
      .where(inArray(schema.tasks.workspaceId, workspaceIds));

    const [mrrRow] = await db
      .select({ value: sql`COALESCE(SUM(${schema.deals.value}), 0)` })
      .from(schema.deals)
      .where(inArray(schema.deals.workspaceId, workspaceIds));

    const [leadsThisMonth] = await db
      .select({ value: count() })
      .from(schema.contacts)
      .where(
        inArray(schema.contacts.workspaceId, workspaceIds) &&
        sql`${schema.contacts.createdAt} >= ${startOfMonth}`
      );

    // ── BUSINESS BREAKDOWN ──
    const businessRows = [];
    for (const biz of businesses) {
      const wsIdsForBiz = workspaces
        .filter(w => w.businessId === biz.id)
        .map(w => w.id);

      const [c] = await db.select({ value: count() }).from(schema.contacts).where(inArray(schema.contacts.workspaceId, wsIdsForBiz));
      const [d] = await db.select({ value: count() }).from(schema.deals).where(inArray(schema.deals.workspaceId, wsIdsForBiz));
      const [t] = await db.select({ value: count() }).from(schema.tasks).where(inArray(schema.tasks.workspaceId, wsIdsForBiz));

      businessRows.push({
        id: biz.id,
        slug: biz.slug,
        name: biz.name,
        contacts: Number(c.value ?? 0),
        deals: Number(d.value ?? 0),
        tasks: Number(t.value ?? 0),
      });
    }

    // ── RECENT ACTIVITY ──
    const recentActivity = await db
      .select()
      .from(schema.activities)
      .where(inArray(schema.activities.workspaceId, workspaceIds))
      .orderBy(sql`${schema.activities.createdAt} DESC`)
      .limit(20);

    return NextResponse.json({
      stats: {
        totalContacts: Number(contactCount.value ?? 0),
        totalDeals: Number(dealCount.value ?? 0),
        totalTasks: Number(taskCount.value ?? 0),
        combinedMRR: Number(Object.values(mrrRow as any)[0] ?? 0),
        leadsThisMonth: Number(leadsThisMonth.value ?? 0),
      },
      businesses: businessRows,
      recentActivity,
    });
  } catch (e: any) {
    console.error("[api/owner/dashboard] error:", e);
    return NextResponse.json({ error: "Failed to load owner dashboard" }, { status: 500 });
  }
}
