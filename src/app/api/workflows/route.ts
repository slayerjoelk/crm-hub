import { type NextRequest, NextResponse } from "next/server";
import { db, schema, ensureTables } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, desc } from "drizzle-orm";

// GET /api/workflows — list with execution counts
export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      await ensureTables();
      const rows = await db.select().from(schema.workflows)
        .where(eq(schema.workflows.workspaceId, workspaceId))
        .orderBy(desc(schema.workflows.createdAt));
      const data = rows.map((w) => ({
        ...w,
        triggerConfig: safeParse(w.triggerConfig, {}),
        conditions: safeParse(w.conditions, []),
        actions: safeParse(w.actions, []),
      }));
      return NextResponse.json({ data });
    } catch {
      return NextResponse.json({ error: "Failed to load workflows" }, { status: 500 });
    }
  });
}

// POST /api/workflows — create
export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId, userId }) => {
    try {
      await ensureTables();
      const body = await req.json();
      if (!body.name || !body.triggerType) {
        return NextResponse.json({ error: "name and triggerType are required" }, { status: 400 });
      }
      const [item] = await db.insert(schema.workflows).values({
        workspaceId,
        name: body.name,
        description: body.description || null,
        status: body.status || "draft",
        triggerType: body.triggerType,
        triggerConfig: JSON.stringify(body.triggerConfig || {}),
        conditions: JSON.stringify(body.conditions || []),
        actions: JSON.stringify(body.actions || []),
        allowReenrollment: !!body.allowReenrollment,
        createdBy: userId === "dev-user" ? null : userId,
      }).returning();
      return NextResponse.json({ data: item });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
    }
  });
}

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
