import { type NextRequest, NextResponse } from "next/server";
import { db, schema, ensureTables } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      await ensureTables();
      const rows = await db.select().from(schema.campaigns)
        .where(eq(schema.campaigns.workspaceId, workspaceId)).orderBy(desc(schema.campaigns.createdAt));
      const members = await db.select().from(schema.campaignMembers);
      const data = rows.map(c => {
        const mine = members.filter(m => m.campaignId === c.id);
        const responded = mine.filter(m => ["responded","registered","attended","converted"].includes(m.status || "")).length;
        const cost = c.actualCost || 0;
        const revenue = c.expectedRevenue || 0;
        const roi = cost > 0 ? Math.round(((revenue - cost) / cost) * 100) : null;
        return { ...c, memberCount: mine.length, respondedCount: responded, roi };
      });
      return NextResponse.json({ data });
    } catch { return NextResponse.json({ error: "Failed to load campaigns" }, { status: 500 }); }
  });
}

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId, userId }) => {
    try {
      await ensureTables();
      const b = await req.json();
      if (!b.name) return NextResponse.json({ error: "name is required" }, { status: 400 });
      const [item] = await db.insert(schema.campaigns).values({
        workspaceId, name: b.name, type: b.type || "email", status: b.status || "planned",
        description: b.description || null,
        budgetedCost: b.budgetedCost ? Number(b.budgetedCost) : 0,
        actualCost: b.actualCost ? Number(b.actualCost) : 0,
        expectedRevenue: b.expectedRevenue ? Number(b.expectedRevenue) : 0,
        startDate: b.startDate ? new Date(b.startDate) : null,
        endDate: b.endDate ? new Date(b.endDate) : null,
        ownerId: userId === "dev-user" ? null : userId,
      }).returning();
      return NextResponse.json({ data: item }, { status: 201 });
    } catch { return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 }); }
  });
}
