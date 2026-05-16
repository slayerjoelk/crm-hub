import { type NextRequest, NextResponse } from "next/server";
import { db, schema, ensureTables } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { scoreContact } from "@/lib/automation/lead-scoring";
import { triggerWebhooks } from "@/lib/automation/webhooks";
import { enrollInSequence } from "@/lib/automation/sequence-engine";

/* ────────────────────────────────────────────
   Lead Capture → Full Pipeline
   
   On POST: 
   1. Create/update contact
   2. Apply tags
   3. Score contact
   4. Auto-enroll in welcome sequence (if exists)
   5. Create follow-up task
   6. Fire webhooks
   7. Send notification to workspace owner
   ─────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    // Ensure tables exist on every cold start
    await ensureTables();
    const apiKey = req.headers.get("x-api-key");
    const workspaceSlug = req.headers.get("x-workspace-slug") ||
      req.nextUrl.searchParams.get("workspace") ||
      "claraccord";

    if (apiKey) {
      await db.select().from(schema.integrations).where(eq(schema.integrations.config, apiKey));
    }

    const [workspace] = await db.select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.slug, workspaceSlug.toLowerCase().trim()));

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      email,
      firstName = "",
      lastName = "",
      phone = "",
      sourceType = "other",
      sourceDetail = "API capture",
      company: companyName = "",
      tags: tagNames = [],
      metadata = {},
    } = body;

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const [anyUser] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.workspaceId, workspace.id));
    const userId = anyUser?.id || "";

    // Check for duplicates
    const [existing] = await db.select()
      .from(schema.contacts)
      .where(eq(schema.contacts.email, email.toLowerCase().trim()));

    if (existing && existing.workspaceId === workspace.id) {
      await db.update(schema.contacts)
        .set({ sourceType: sourceType || existing.sourceType, sourceDetail: sourceDetail || existing.sourceDetail, lastActivityAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.contacts.id, existing.id));
      return NextResponse.json({ success: true, data: { id: existing.id, email: existing.email }, duplicate: true });
    }

    // Create or find company
    let companyId: string | undefined;
    if (companyName) {
      const [ec] = await db.select().from(schema.companies).where(eq(schema.companies.name, companyName.trim()));
      if (ec && ec.workspaceId === workspace.id) companyId = ec.id;
      else {
        const [nc] = await db.insert(schema.companies).values({ workspaceId: workspace.id, name: companyName.trim(), type: "prospect" }).returning();
        companyId = nc.id;
      }
    }

    // Create contact
    const [contact] = await db.insert(schema.contacts)
      .values({ workspaceId: workspace.id, firstName, lastName, email: email.toLowerCase().trim(), phone: phone || undefined, sourceType, sourceDetail, lifecycleStage: "subscriber", leadStatus: "new", companyId, lastActivityAt: new Date() })
      .returning();

    // Log activity
    if (userId) {
      await db.insert(schema.activities).values({ workspaceId: workspace.id, userId, type: "contact_created", contactId: contact.id, body: `New lead: ${firstName} ${lastName} (${email}). Source: ${sourceDetail}.`, metadata: JSON.stringify(metadata) });
    }

    // Apply tags
    if (tagNames.length > 0) {
      for (const tagName of tagNames) {
        let [tag] = await db.select().from(schema.tags).where(and(eq(schema.tags.name, tagName), eq(schema.tags.workspaceId, workspace.id)));
        if (!tag) [tag] = await db.insert(schema.tags).values({ workspaceId: workspace.id, name: tagName, color: "#3b82f6" }).returning();
        await db.insert(schema.tagRelations).values({ tagId: tag.id, entityType: "contact", entityId: contact.id });
      }
    }

    // Auto-score
    let contactScore = 0;
    try { const r = await scoreContact(contact.id); contactScore = r.total; } catch {}

    // Auto-enroll in welcome sequence
    let enrollment = null;
    try {
      const seqs = await db.select().from(schema.sequences).where(and(eq(schema.sequences.workspaceId, workspace.id), eq(schema.sequences.status, "active")));
      for (const seq of seqs) {
        if (seq.type === "cold_outreach" || seq.name.toLowerCase().includes("welcome")) {
          enrollment = await enrollInSequence(seq.id, contact.id);
          if (enrollment.enrolled) {
            await db.insert(schema.activities).values({ workspaceId: workspace.id, userId, type: "integration", contactId: contact.id, body: `Auto-enrolled in sequence: ${seq.name}` });
            break;
          }
        }
      }
    } catch {}

    // Create follow-up task
    try {
      await db.insert(schema.tasks).values({ workspaceId: workspace.id, userId, title: `Follow up: ${firstName} ${lastName}`.trim(), description: `New lead from ${sourceDetail}. Score: ${contactScore}/100.`, contactId: contact.id, status: "todo", priority: contactScore > 70 ? "high" : "medium", dueDate: new Date(Date.now() + 86400000) });
    } catch {}

    // Fire webhooks
    try { await triggerWebhooks(workspace.id, "contact.created", "contact", contact.id, { email: contact.email, name: `${firstName} ${lastName}`.trim(), source: sourceType, score: contactScore }); } catch {}

    // Notify workspace
    try { if (userId) await db.insert(schema.notifications).values({ workspaceId: workspace.id, userId, type: "contact", title: "New lead captured", body: `${firstName} ${lastName} (${email}) from ${sourceDetail}` }); } catch {}

    return NextResponse.json({ success: true, data: { ...contact, leadScore: contactScore, enrolled: enrollment?.enrolled || false } }, { status: 201 });
  } catch (e: any) {
    console.error("Capture error:", e);
    return NextResponse.json({ error: "Capture failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "CRM Hub Lead Capture" });
}
