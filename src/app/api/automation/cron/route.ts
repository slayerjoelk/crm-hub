import { type NextRequest, NextResponse } from "next/server";
import { scoreAllInWorkspace } from "@/lib/automation/lead-scoring";
import { processSequences } from "@/lib/automation/sequence-engine";
import { autoCreateTasks } from "@/lib/automation/tasks";
import { processScheduledWorkflows } from "@/lib/automation/workflow-engine";
import { db, schema, ensureTables } from "@/lib/db";
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

// Fail-secure: no hardcoded fallback. A known default secret here would let
// anyone trigger automation for any workspace. If CRON_SECRET is unset the
// endpoint is disabled rather than guarded by a public constant.
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: "Cron endpoint not configured (CRON_SECRET unset)" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth || auth !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceSlug = req.nextUrl.searchParams.get("workspace");
  const results: Record<string, any> = {};

  try {
    await ensureTables();

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

      // Workflow Automation (score-threshold + scheduled)
      try {
        const stats = await processScheduledWorkflows(ws.id);
        results[ws.slug].workflows = stats;
      } catch (e: any) {
        results[ws.slug].workflows = { error: e.message };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
