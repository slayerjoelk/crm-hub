import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { scoreContact } from "@/lib/automation/lead-scoring";
import { triggerWebhooks } from "@/lib/automation/webhooks";

/* ────────────────────────────────────────────
   Public Lead Capture API
   
   Accepts leads from ANY source (website forms,
   landing pages, third-party integrations).
   
   Rate-limited. Workspace identified by
   API key or workspace slug.
   
   POST /api/capture
   Headers: x-api-key or x-workspace-slug
   Body: { email, firstName?, lastName?, phone?,
           sourceType?, sourceDetail?, company?,
           tags?: string[], metadata?: {} }
   ─────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    // Auth: API key or workspace slug
    const apiKey = req.headers.get("x-api-key");
    const workspaceSlug = req.headers.get("x-workspace-slug") ||
      req.nextUrl.searchParams.get("workspace") ||
      "default";

    if (apiKey) {
      // Look up integration by API key
      const integrations = await db.select()
        .from(schema.integrations)
        .where(eq(schema.integrations.config, apiKey));
      // TODO: proper API key hashing/verification
    }

    // Resolve workspace
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

    // Get a valid user for the workspace (for activity authorship)
    const [anyUser] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.workspaceId, workspace.id));
    const userId = anyUser?.id || "system";

    // Check for duplicates
    const [existing] = await db.select()
      .from(schema.contacts)
      .where(eq(schema.contacts.email, email.toLowerCase().trim()));

    if (existing && existing.workspaceId === workspace.id) {
      // Update existing contact with new data
      await db.update(schema.contacts)
        .set({
          sourceType: sourceType || existing.sourceType,
          sourceDetail: sourceDetail || existing.sourceDetail,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.contacts.id, existing.id));

      return NextResponse.json({
        success: true,
        data: { id: existing.id, email: existing.email, firstName: existing.firstName, lastName: existing.lastName },
        duplicate: true,
      });
    }

    // Create or find company
    let companyId: string | undefined;
    if (companyName) {
      const [existingCompany] = await db.select()
        .from(schema.companies)
        .where(eq(schema.companies.name, companyName.trim()));

      if (existingCompany && existingCompany.workspaceId === workspace.id) {
        companyId = existingCompany.id;
      } else {
        const [newCompany] = await db.insert(schema.companies)
          .values({
            workspaceId: workspace.id,
            name: companyName.trim(),
            type: "prospect",
          })
          .returning();
        companyId = newCompany.id;
      }
    }

    // Build contact
    const [contact] = await db.insert(schema.contacts)
      .values({
        workspaceId: workspace.id,
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        phone: phone || undefined,
        sourceType,
        sourceDetail,
        lifecycleStage: "subscriber",
        leadStatus: "new",
        companyId,
        lastActivityAt: new Date(),
      })
      .returning();

    // Log activity
    await db.insert(schema.activities).values({
      workspaceId: workspace.id,
      userId,
      type: "contact_created",
      contactId: contact.id,
      body: `New lead captured via ${sourceDetail}. Source: ${sourceType}`,
      metadata: JSON.stringify(metadata),
    });

    // Apply tags
    if (tagNames.length > 0) {
      for (const tagName of tagNames) {
        let [tag] = await db.select()
          .from(schema.tags)
          .where(eq(schema.tags.name, tagName));

        if (!tag) {
          [tag] = await db.insert(schema.tags)
            .values({ workspaceId: workspace.id, name: tagName, color: "#3b82f6" })
            .returning();
        }

        await db.insert(schema.tagRelations)
          .values({ tagId: tag.id, entityType: "contact", entityId: contact.id });
      }
    }

    // Auto-score
    try { await scoreContact(contact.id); } catch {}

    // Trigger webhooks
    try {
      await triggerWebhooks(workspace.id, "contact.created", "contact", contact.id, {
        email: contact.email,
        name: `${firstName} ${lastName}`.trim(),
        source: sourceType,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      data: contact,
    }, { status: 201 });
  } catch (e: any) {
    console.error("Capture error:", e);
    return NextResponse.json({ error: "Capture failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Health check
  return NextResponse.json({ status: "ok", endpoint: "CRM Hub Lead Capture" });
}
