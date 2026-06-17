import { type NextRequest, NextResponse } from "next/server";
import { db, schema, ensureTables } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, desc } from "drizzle-orm";

// GET /api/templates — list email templates
export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      await ensureTables();
      const rows = await db.select().from(schema.emailTemplates)
        .where(eq(schema.emailTemplates.workspaceId, workspaceId))
        .orderBy(desc(schema.emailTemplates.createdAt));
      return NextResponse.json({ data: rows });
    } catch {
      return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
    }
  });
}

// POST /api/templates — create
export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId, userId }) => {
    try {
      await ensureTables();
      const body = await req.json();
      if (!body.name || !body.subject || !body.body) {
        return NextResponse.json({ error: "name, subject and body are required" }, { status: 400 });
      }
      const [item] = await db.insert(schema.emailTemplates).values({
        workspaceId,
        name: body.name,
        subject: body.subject,
        body: body.body,
        category: body.category || "custom",
        createdBy: userId === "dev-user" ? null : userId,
      }).returning();
      return NextResponse.json({ data: item });
    } catch {
      return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
    }
  });
}
