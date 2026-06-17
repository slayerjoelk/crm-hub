import { type NextRequest, NextResponse } from "next/server";
import { db, schema, ensureTables } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";

const SENIORITY_RATING: Record<string, string> = {
  founder: "hot", owner: "hot", c_suite: "hot", vp: "warm", director: "warm",
  manager: "warm", senior: "cold", entry: "cold", other: "cold",
};

// POST /api/prospecting/import — turn selected prospects into leads (in the given workspace)
// body: { prospectIds: string[], workspace?: slug, listName?: string }
export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const { prospectIds = [], workspace, listName } = await req.json();
    if (!Array.isArray(prospectIds) || prospectIds.length === 0) {
      return NextResponse.json({ error: "No prospects selected" }, { status: 400 });
    }

    // Resolve target workspace: explicit slug → header → first active (dev fallback)
    let workspaceId: string | undefined;
    if (workspace) {
      const [ws] = await db.select().from(schema.workspaces).where(eq(schema.workspaces.slug, String(workspace).toLowerCase()));
      workspaceId = ws?.id;
    }
    if (!workspaceId) {
      const active = await db.select().from(schema.workspaces).where(eq(schema.workspaces.status, "active"));
      workspaceId = active[0]?.id;
    }
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

    const rows = await db.select().from(schema.prospects).where(inArray(schema.prospects.id, prospectIds));
    const existing = await db.select({ email: schema.leads.email }).from(schema.leads).where(eq(schema.leads.workspaceId, workspaceId));
    const existingEmails = new Set(existing.map(e => (e.email || "").toLowerCase()).filter(Boolean));

    let imported = 0, skipped = 0;
    for (const p of rows) {
      const email = (p.email || "").toLowerCase();
      if (email && existingEmails.has(email)) { skipped++; continue; }
      await db.insert(schema.leads).values({
        workspaceId,
        firstName: p.firstName, lastName: p.lastName, email: p.email || null,
        jobTitle: p.title || null, company: p.companyName, website: p.domain || null,
        industry: p.industry || null, employeeCount: p.employeeCount || null, annualRevenue: p.annualRevenue || null,
        country: p.country || null, city: p.city || null, linkedinUrl: p.linkedinUrl || null,
        status: "new", rating: (SENIORITY_RATING[p.seniority || "other"] as any) || "cold",
        source: "prospecting", sourceDetail: listName ? `Prospecting list: ${listName}` : "Prospecting",
        lastActivityAt: new Date(),
      });
      if (email) existingEmails.add(email);
      imported++;
    }

    return NextResponse.json({ data: { imported, skipped, total: rows.length } }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
