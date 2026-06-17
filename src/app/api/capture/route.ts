import { type NextRequest, NextResponse } from "next/server";
import { db, schema, ensureTables } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { scoreContact } from "@/lib/automation/lead-scoring";
import { triggerWebhooks } from "@/lib/automation/webhooks";
import { enrollInSequence } from "@/lib/automation/sequence-engine";
import { runWorkflows } from "@/lib/automation/workflow-engine";

/* ────────────────────────────────────────────
   Lead Capture → Full Pipeline
   Supports both workspace-slug and domain-based routing.
   ─────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    await ensureTables();

    const apiKey = req.headers.get("x-api-key");
    const workspaceSlug = req.headers.get("x-workspace-slug") || req.nextUrl.searchParams.get("workspace") || "";
    const domain = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";

    let workspaceId: string | undefined;

    // Resolve by workspace slug first
    if (workspaceSlug) {
      const [ws] = await db.select().from(schema.workspaces).where(eq(schema.workspaces.slug, workspaceSlug.toLowerCase().trim()));
      if (ws) workspaceId = ws.id;
    }

    // Fallback: resolve workspace by domain (business domain or workspace domain)
    if (!workspaceId && domain) {
      const cleanDomain = domain.replace(/:\d+$/, "");
      // Try workspace custom domain
      const [wsByDomain] = await db
        .select()
        .from(schema.workspaces)
        .where(eq(schema.workspaces.domain, cleanDomain));
      if (wsByDomain) workspaceId = wsByDomain.id;
      else {
        // Try business domain → first workspace of that business
        const [biz] = await db
          .select()
          .from(schema.businesses)
          .where(eq(schema.businesses.domain, cleanDomain));
        if (biz) {
          const [bizWs] = await db
            .select()
            .from(schema.workspaces)
            .where(eq(schema.workspaces.businessId, biz.id))
            .limit(1);
          if (bizWs) workspaceId = bizWs.id;
        }
      }
    }

    // Ultimate fallback: "claraccord" workspace or first workspace
    if (!workspaceId) {
      const [wsFallback] = await db
        .select()
        .from(schema.workspaces)
        .where(eq(schema.workspaces.slug, "claraccord"))
        .limit(1);
      if (wsFallback) workspaceId = wsFallback.id;
      else {
        const [firstWs] = await db.select().from(schema.workspaces).limit(1);
        workspaceId = firstWs?.id;
      }
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      email,
      firstName = "",
      lastName = "",
      phone = "",
      jobTitle = "",
      sourceType = "other",
      sourceDetail = "API capture",
      company: companyName = "",
      tags: tagNames = [],
      metadata = {},
    } = body;

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const [anyUser] = await db.select().from(schema.users).where(eq(schema.users.workspaceId, workspaceId));
    const userId = anyUser?.id || "";

    // Check for duplicates within same workspace
    const existingRows = await db
      .select()
      .from(schema.contacts)
      .where(eq(schema.contacts.email, email.toLowerCase().trim()));
    const existing = existingRows.find(c => c.workspaceId === workspaceId);

    if (existing) {
      await db.update(schema.contacts)
        .set({ sourceType: sourceType || existing.sourceType, sourceDetail: sourceDetail || existing.sourceDetail, lastActivityAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.contacts.id, existing.id));
      return NextResponse.json({ success: true, data: { id: existing.id, email: existing.email }, duplicate: true });
    }

    // Create or find company
    let companyId: string | undefined;
    if (companyName) {
      const companyRows = await db.select().from(schema.companies).where(eq(schema.companies.name, companyName.trim()));
      const ec = companyRows.find(c => c.workspaceId === workspaceId);
      if (ec) companyId = ec.id;
      else {
        const [nc] = await db.insert(schema.companies).values({ workspaceId, name: companyName.trim(), type: "prospect" }).returning();
        companyId = nc.id;
      }
    }

    // Create contact
    const [contact] = await db.insert(schema.contacts)
      .values({ workspaceId, firstName, lastName, email: email.toLowerCase().trim(), phone: phone || undefined, jobTitle: jobTitle || undefined, sourceType, sourceDetail, lifecycleStage: "subscriber", leadStatus: "new", companyId, lastActivityAt: new Date() })
      .returning();

    // Log activity
    if (userId) {
      await db.insert(schema.activities).values({ workspaceId, userId, type: "contact_created", contactId: contact.id, body: `New lead: ${firstName} ${lastName} (${email}). Source: ${sourceDetail}.`, metadata: JSON.stringify(metadata) });
    }

    // Apply tags
    if (tagNames.length > 0) {
      for (const tagName of tagNames) {
        let tagRows = await db.select().from(schema.tags).where(and(eq(schema.tags.name, tagName), eq(schema.tags.workspaceId, workspaceId)));
        let tag = tagRows[0];
        if (!tag) [tag] = await db.insert(schema.tags).values({ workspaceId, name: tagName, color: "#3b82f6" }).returning();
        await db.insert(schema.tagRelations).values({ tagId: tag.id, entityType: "contact", entityId: contact.id });
      }
    }

    // Auto-score
    let contactScore = 0;
    try { const r = await scoreContact(contact.id); contactScore = r.total; } catch {}

    // Auto-enroll in welcome sequence
    let enrollment = null;
    try {
      const seqs = await db.select().from(schema.sequences).where(and(eq(schema.sequences.workspaceId, workspaceId), eq(schema.sequences.status, "active")));
      for (const seq of seqs) {
        if (seq.type === "cold_outreach" || seq.name.toLowerCase().includes("welcome")) {
          enrollment = await enrollInSequence(seq.id, contact.id);
          if (enrollment.enrolled) {
            await db.insert(schema.activities).values({ workspaceId, userId, type: "integration", contactId: contact.id, body: `Auto-enrolled in sequence: ${seq.name}` });
            break;
          }
        }
      }
    } catch {}

    // Create follow-up task
    try {
      await db.insert(schema.tasks).values({ workspaceId, userId, title: `Follow up: ${firstName} ${lastName}`.trim(), description: `New lead from ${sourceDetail}. Score: ${contactScore}/100.`, contactId: contact.id, status: "todo", priority: contactScore > 70 ? "high" : "medium", dueDate: new Date(Date.now() + 86400000) });
    } catch {}

    // Fire webhooks
    try { await triggerWebhooks(workspaceId, "contact.created", "contact", contact.id, { email: contact.email, name: `${firstName} ${lastName}`.trim(), source: sourceType, score: contactScore }); } catch {}

    // Notify workspace
    try { if (userId) await db.insert(schema.notifications).values({ workspaceId, userId, type: "contact", title: "New lead captured", body: `${firstName} ${lastName} (${email}) from ${sourceDetail}` }); } catch {}

    // Run automation workflows (contact_created + score threshold)
    try {
      const enriched = { ...contact, leadScore: contactScore, company: companyName };
      await runWorkflows(workspaceId, "contact_created", "contact", enriched, { score: contactScore });
      await runWorkflows(workspaceId, "lead_score_threshold", "contact", enriched, { score: contactScore });
    } catch {}

    return NextResponse.json({ success: true, data: { ...contact, leadScore: contactScore, enrolled: enrollment?.enrolled || false } }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Capture failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "CRM Hub Lead Capture" });
}
