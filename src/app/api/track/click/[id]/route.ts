import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { runWorkflows } from "@/lib/automation/workflow-engine";

// GET /api/track/click/:id?u=<url> — record click, redirect to target
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const target = req.nextUrl.searchParams.get("u");
  const dest = target && /^https?:\/\//i.test(target) ? target : (process.env.NEXT_PUBLIC_APP_URL || "/");

  try {
    const [email] = await db.select().from(schema.emails).where(eq(schema.emails.id, id));
    if (email) {
      const patch: Record<string, any> = { clickedAt: new Date() };
      if (!email.openedAt) patch.openedAt = new Date(); // a click implies an open
      await db.update(schema.emails).set(patch).where(eq(schema.emails.id, id));
      if (email.contactId) {
        await db.insert(schema.activities).values({
          workspaceId: email.workspaceId, userId: "system", type: "email", contactId: email.contactId,
          subject: email.subject, body: `Clicked link in: "${email.subject}"`,
        }).catch(() => {});
        const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, email.contactId));
        if (contact) await runWorkflows(email.workspaceId, "email_clicked", "contact", contact, {}).catch(() => {});
      }
    }
  } catch { /* still redirect */ }

  return NextResponse.redirect(dest, 302);
}
