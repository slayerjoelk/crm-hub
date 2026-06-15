// Run CRM-Hub automation cron manually via Node/TS
import { db, schema } from "../src/lib/db";
import { eq } from "drizzle-orm";
import { scoreAllInWorkspace } from "../src/lib/automation/lead-scoring";
import { processSequences } from "../src/lib/automation/sequence-engine";
import { autoCreateTasks } from "../src/lib/automation/tasks";

async function main() {
  const workspaceSlug = process.argv[2] || undefined;
  const results: Record<string, any> = {};

  try {
    const workspaces = workspaceSlug
      ? await db.select().from(schema.workspaces).where(eq(schema.workspaces.slug, workspaceSlug))
      : await db.select().from(schema.workspaces).where(eq(schema.workspaces.status, "active"));

    console.log(`Found ${workspaces.length} workspace(s).`);

    for (const ws of workspaces) {
      const wsSlug = ws.slug || ws.name;
      results[wsSlug] = {};
      console.log(`\n--- Processing workspace: ${wsSlug} (id=${ws.id}) ---`);

      // Lead Scoring
      try {
        const count = await scoreAllInWorkspace(ws.id);
        results[wsSlug].scoring = { contacts: count };
        console.log(`  Scoring: ${count} contacts processed`);
      } catch (e: any) {
        results[wsSlug].scoring = { error: e.message };
        console.error(`  Scoring error: ${e.message}`);
      }

      // Sequence Processing
      try {
        const stats = await processSequences(ws.id);
        results[wsSlug].sequences = stats;
        console.log(`  Sequences:`, stats);
      } catch (e: any) {
        results[wsSlug].sequences = { error: e.message };
        console.error(`  Sequences error: ${e.message}`);
      }

      // Task Automation
      try {
        const stats = await autoCreateTasks(ws.id);
        results[wsSlug].tasks = stats;
        console.log(`  Tasks:`, stats);
      } catch (e: any) {
        results[wsSlug].tasks = { error: e.message };
        console.error(`  Tasks error: ${e.message}`);
      }
    }

    console.log("\n=== DONE ===");
    console.log(JSON.stringify({ success: true, results }, null, 2));
    process.exit(0);
  } catch (e: any) {
    console.error("Fatal error:", e.message);
    process.exit(1);
  }
}

main();
