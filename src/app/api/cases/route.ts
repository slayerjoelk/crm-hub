import { type NextRequest, NextResponse } from "next/server";
import { db, schema, ensureTables } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      await ensureTables();
      const rows = await db.select().from(schema.cases)
        .where(eq(schema.cases.workspaceId, workspaceId)).orderBy(desc(schema.cases.createdAt));
      return NextResponse.json({ data: rows });
    } catch { return NextResponse.json({ error: "Failed to load cases" }, { status: 500 }); }
  });
}

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId, userId }) => {
    try {
      await ensureTables();
      const b = await req.json();
      if (!b.subject) return NextResponse.json({ error: "subject is required" }, { status: 400 });
      const all = await db.select({ n: schema.cases.caseNumber }).from(schema.cases).where(eq(schema.cases.workspaceId, workspaceId));
      const nextNum = (all.reduce((m, r) => Math.max(m, r.n || 0), 0)) + 1;
      const [item] = await db.insert(schema.cases).values({
        workspaceId, caseNumber: nextNum, subject: b.subject, description: b.description || null,
        status: b.status || "new", priority: b.priority || "medium", type: b.type || "question",
        origin: b.origin || "web", contactId: b.contactId || null, companyId: b.companyId || null,
        ownerId: userId === "dev-user" ? null : userId,
      }).returning();
      return NextResponse.json({ data: item }, { status: 201 });
    } catch { return NextResponse.json({ error: "Failed to create case" }, { status: 500 }); }
  });
}
