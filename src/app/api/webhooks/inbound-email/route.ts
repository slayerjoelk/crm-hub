import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { runWorkflows } from "@/lib/automation/workflow-engine";

/* ────────────────────────────────────────────
   Inbound Email Webhook (replies)
   Point your inbound-parse provider here. Accepts a flexible
   payload; we read the sender address + subject, match the
   contact, record an inbound email, stop their sequences,
   and fire the contact_replied workflow trigger.

   Required header: x-workspace-slug  (which workspace owns the inbox)
   ─────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const fromEmail = (body.from || body.sender || body.email || "").toString().toLowerCase().trim();
  const subject = body.subject || "Re: (no subject)";
  const text = body.text || body.body || "";
  const slug = req.headers.get("x-workspace-slug") || body.workspace || "";
  if (!fromEmail) return NextResponse.json({ error: "missing sender" }, { status: 400 });

  try {
    // Resolve workspace
    let workspaceId: string | undefined;
    if (slug) {
      const [ws] = await db.select().from(schema.workspaces).where(eq(schema.workspaces.slug, slug.toLowerCase()));
      workspaceId = ws?.id;
    }

    // Match contact by email (within workspace if known)
    const contactRows = await db.select().from(schema.contacts).where(eq(schema.contacts.email, fromEmail));
    const contact = workspaceId ? contactRows.find((c) => c.workspaceId === workspaceId) : contactRows[0];
    if (!contact) return NextResponse.json({ ok: true, skipped: "no matching contact" });
    workspaceId = contact.workspaceId;

    // Record the inbound email
    await db.insert(schema.emails).values({
      workspaceId, fromEmail, toEmail: process.env.EMAIL_FROM || "crm@yourdomain.com",
      subject, textBody: text, contactId: contact.id, direction: "inbound",
      deliveryStatus: "delivered", sentAt: new Date(),
    });

    // Mark engagement + stop active sequences (they replied!)
    await db.update(schema.contacts).set({ lastEngagementAt: new Date(), lastActivityAt: new Date() }).where(eq(schema.contacts.id, contact.id));
    const enrollments = await db.select().from(schema.sequenceEnrollments)
      .where(and(eq(schema.sequenceEnrollments.contactId, contact.id), eq(schema.sequenceEnrollments.status, "active")));
    for (const en of enrollments) {
      await db.update(schema.sequenceEnrollments).set({ status: "replied", completedAt: new Date() }).where(eq(schema.sequenceEnrollments.id, en.id));
    }

    await db.insert(schema.activities).values({
      workspaceId, userId: "system", type: "email", contactId: contact.id, subject, body: `Reply received: "${subject}"`, metadata: JSON.stringify({ direction: "inbound" }),
    }).catch(() => {});

    await runWorkflows(workspaceId, "contact_replied", "contact", contact, {}).catch(() => {});

    return NextResponse.json({ ok: true, contactId: contact.id });
  } catch (e: any) {
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
