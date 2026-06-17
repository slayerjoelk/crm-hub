import { type NextRequest, NextResponse } from "next/server";
import { db, schema, ensureTables } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, desc } from "drizzle-orm";
import { REPORT_SCHEMA } from "@/lib/reporting";

// GET /api/reports — saved reports + the report schema (for the builder)
export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      await ensureTables();
      const rows = await db.select().from(schema.reports)
        .where(eq(schema.reports.workspaceId, workspaceId)).orderBy(desc(schema.reports.createdAt));
      const data = rows.map(r => ({ ...r, config: safe(r.config) }));
      return NextResponse.json({ data, schema: REPORT_SCHEMA });
    } catch {
      return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
    }
  });
}

// POST /api/reports — save a report config
export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId, userId }) => {
    try {
      await ensureTables();
      const b = await req.json();
      if (!b.name || !b.config) return NextResponse.json({ error: "name and config required" }, { status: 400 });
      const [item] = await db.insert(schema.reports).values({
        workspaceId, name: b.name, description: b.description || null,
        config: JSON.stringify(b.config), createdBy: userId === "dev-user" ? null : userId,
      }).returning();
      return NextResponse.json({ data: { ...item, config: b.config } }, { status: 201 });
    } catch {
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
    }
  });
}

function safe(raw: string | null) { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } }
