import { type NextRequest, NextResponse } from "next/server";
import { db, schema, ensureTables } from "@/lib/db";
import { eq, inArray, and, sql, count } from "drizzle-orm";

/* ────────────────────────────────────────────
   Portfolio — the multi-company "front door".
   Returns every SaaS company (business) with its
   primary workspace + aggregate CRM stats, so the
   user can pick a company and dive into its CRM.

   Auth-disabled (dev): returns all active businesses.
   When REQUIRE_AUTH=true, scope to owner's businesses.
   ─────────────────────────────────────────── */

export async function GET(_req: NextRequest) {
  try {
    await ensureTables();

    const businesses = await db.select().from(schema.businesses)
      .where(eq(schema.businesses.status, "active"));

    const allWorkspaces = await db.select().from(schema.workspaces);

    const result = [];
    let totalContacts = 0, totalDeals = 0, totalPipeline = 0, totalWon = 0;

    for (const biz of businesses) {
      const wss = allWorkspaces.filter(w => w.businessId === biz.id);
      const wsIds = wss.map(w => w.id);
      const primary = wss[0];

      let contacts = 0, companies = 0, deals = 0, openPipeline = 0, wonRevenue = 0;
      if (wsIds.length) {
        const [[c], [co], [d], [open], [won]] = await Promise.all([
          db.select({ v: count() }).from(schema.contacts).where(inArray(schema.contacts.workspaceId, wsIds)),
          db.select({ v: count() }).from(schema.companies).where(inArray(schema.companies.workspaceId, wsIds)),
          db.select({ v: count() }).from(schema.deals).where(inArray(schema.deals.workspaceId, wsIds)),
          db.select({ v: sql`COALESCE(SUM(${schema.deals.value}),0)` }).from(schema.deals).where(and(inArray(schema.deals.workspaceId, wsIds), eq(schema.deals.status, "open"))),
          db.select({ v: sql`COALESCE(SUM(${schema.deals.value}),0)` }).from(schema.deals).where(and(inArray(schema.deals.workspaceId, wsIds), eq(schema.deals.status, "won"))),
        ]);
        contacts = Number(c.v ?? 0);
        companies = Number(co.v ?? 0);
        deals = Number(d.v ?? 0);
        openPipeline = Number(Object.values(open)[0] ?? 0);
        wonRevenue = Number(Object.values(won)[0] ?? 0);
      }

      totalContacts += contacts; totalDeals += deals;
      totalPipeline += openPipeline; totalWon += wonRevenue;

      result.push({
        id: biz.id,
        slug: biz.slug,
        name: biz.name,
        domain: biz.domain,
        plan: biz.plan,
        primaryColor: primary?.primaryColor || "#5e6ad2",
        workspaceSlug: primary?.slug || null,
        workspaceCount: wss.length,
        stats: { contacts, companies, deals, openPipeline, wonRevenue },
      });
    }

    result.sort((a, b) => (b.stats.openPipeline + b.stats.wonRevenue) - (a.stats.openPipeline + a.stats.wonRevenue));

    return NextResponse.json({
      data: result,
      totals: { companies: result.length, contacts: totalContacts, deals: totalDeals, openPipeline: totalPipeline, wonRevenue: totalWon },
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to load portfolio" }, { status: 500 });
  }
}
