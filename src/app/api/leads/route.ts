import { type NextRequest, NextResponse } from "next/server";
import { db, schema, ensureTables } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and, desc } from "drizzle-orm";

// GET /api/leads — list (optionally ?status= &q=)
export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      await ensureTables();
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status");
      const q = searchParams.get("q")?.toLowerCase();
      let list = await db.select().from(schema.leads)
        .where(eq(schema.leads.workspaceId, workspaceId))
        .orderBy(desc(schema.leads.createdAt));
      if (status) list = list.filter(l => l.status === status);
      if (q) list = list.filter(l =>
        `${l.firstName ?? ""} ${l.lastName ?? ""}`.toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        (l.company ?? "").toLowerCase().includes(q));
      return NextResponse.json({ data: list });
    } catch {
      return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
    }
  });
}

// POST /api/leads — create
export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId, userId }) => {
    try {
      await ensureTables();
      const b = await req.json();
      const [item] = await db.insert(schema.leads).values({
        workspaceId,
        ownerId: userId === "dev-user" ? null : userId,
        firstName: b.firstName || null,
        lastName: b.lastName || null,
        email: b.email ? String(b.email).toLowerCase().trim() : null,
        phone: b.phone || null,
        jobTitle: b.jobTitle || null,
        company: b.company || null,
        website: b.website || null,
        industry: b.industry || null,
        employeeCount: b.employeeCount ? Number(b.employeeCount) : null,
        annualRevenue: b.annualRevenue ? Number(b.annualRevenue) : null,
        status: b.status || "new",
        rating: b.rating || "cold",
        source: b.source || "other",
        sourceDetail: b.sourceDetail || null,
        city: b.city || null,
        state: b.state || null,
        country: b.country || null,
        linkedinUrl: b.linkedinUrl || null,
        notes: b.notes || null,
        leadScore: b.leadScore ? Number(b.leadScore) : 0,
        lastActivityAt: new Date(),
      }).returning();
      return NextResponse.json({ data: item }, { status: 201 });
    } catch {
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }
  });
}
