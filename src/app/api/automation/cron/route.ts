import { type NextRequest, NextResponse } from "next/server";
import { scoreAllInWorkspace } from "@/lib/automation/lead-scoring";
import { processSequences } from "@/lib/automation/sequence-engine";
import { autoCreateTasks } from "@/lib/automation/tasks";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

/* ────────────────────────────────────────────
   Automation Cron Endpoint
   
   Runs all automation engines for a workspace.
   Designed to be called by Vercel Cron Jobs
   or external scheduler.
   
   GET /api/automation/cron
   Headers: Authorization: Bearer <CRON_SECRET>
   Query: ?workspace=slug (optional, default: all)
   ─────────────────────────────────────────── */

const CRON_SECRET = process.env.CRON_SECRET || "crm-hub-cron-secret";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceSlug = req.nextUrl.searchParams.get("workspace");
  const results: Record<string, any> = {};

  try {
    const workspaces = workspaceSlug
      ? await db.select().from(schema.workspaces)
          .where(eq(schema.workspaces.slug, workspaceSlug))
      : await db.select().from(schema.workspaces)
          .where(eq(schema.workspaces.status, "active"));

    for (const ws of workspaces) {
      results[ws.slug] = {};

      // Lead Scoring
      try {
        const count = await scoreAllInWorkspace(ws.id);
        results[ws.slug].scoring = { contacts: count };
      } catch (e: any) {
        results[ws.slug].scoring = { error: e.message };
      }

      // Sequence Processing
      try {
        const stats = await processSequences(ws.id);
        results[ws.slug].sequences = stats;
      } catch (e: any) {
        results[ws.slug].sequences = { error: e.message };
      }

      // Task Automation
      try {
        const stats = await autoCreateTasks(ws.id);
        results[ws.slug].tasks = stats;
      } catch (e: any) {
        results[ws.slug].tasks = { error: e.message };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
