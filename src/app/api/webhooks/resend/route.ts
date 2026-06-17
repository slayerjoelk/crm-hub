import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { runWorkflows } from "@/lib/automation/workflow-engine";

/* ────────────────────────────────────────────
   Resend Event Webhook
   Configure in Resend dashboard → Webhooks → this URL.
   Events: email.delivered, email.opened, email.clicked,
           email.bounced, email.complained
   Matched to our email rows via provider_message_id.
   ─────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  let payload: any;
  try { payload = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const type: string = payload?.type || "";
  const providerId: string | undefined = payload?.data?.email_id || payload?.data?.id;
  if (!providerId) return NextResponse.json({ ok: true, skipped: "no email_id" });

  try {
    const [email] = await db.select().from(schema.emails).where(eq(schema.emails.providerMessageId, providerId));
    if (!email) return NextResponse.json({ ok: true, skipped: "unknown email" });

    const now = new Date();
    switch (type) {
      case "email.delivered":
        await db.update(schema.emails).set({ deliveryStatus: "delivered" }).where(eq(schema.emails.id, email.id));
        break;

      case "email.opened":
        if (!email.openedAt) await db.update(schema.emails).set({ openedAt: now }).where(eq(schema.emails.id, email.id));
        await fireContactWorkflow(email, "email_opened");
        break;

      case "email.clicked":
        await db.update(schema.emails).set({ clickedAt: now, openedAt: email.openedAt || now }).where(eq(schema.emails.id, email.id));
        await fireContactWorkflow(email, "email_clicked");
        break;

      case "email.bounced":
        await db.update(schema.emails).set({ deliveryStatus: "bounced", bouncedAt: now, error: "Bounced (Resend)" }).where(eq(schema.emails.id, email.id));
        if (email.contactId) {
          // Stop active sequence enrollments + flag the contact
          const enrollments = await db.select().from(schema.sequenceEnrollments).where(eq(schema.sequenceEnrollments.contactId, email.contactId));
          for (const en of enrollments) {
            if (en.status === "active") await db.update(schema.sequenceEnrollments).set({ status: "bounced", completedAt: now }).where(eq(schema.sequenceEnrollments.id, en.id));
          }
          await db.update(schema.contacts).set({ emailOptOut: true }).where(eq(schema.contacts.id, email.contactId));
        }
        await fireContactWorkflow(email, "email_bounced");
        break;

      case "email.complained":
        if (email.contactId) await db.update(schema.contacts).set({ emailOptOut: true }).where(eq(schema.contacts.id, email.contactId));
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}

async function fireContactWorkflow(email: any, trigger: "email_opened" | "email_clicked" | "email_bounced") {
  if (!email.contactId) return;
  const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, email.contactId));
  if (contact) await runWorkflows(email.workspaceId, trigger, "contact", contact, {}).catch(() => {});
}
