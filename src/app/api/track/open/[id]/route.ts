import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { runWorkflows } from "@/lib/automation/workflow-engine";

// 1x1 transparent GIF
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

// GET /api/track/open/:id — record an email open, return pixel
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  try {
    const [email] = await db.select().from(schema.emails).where(eq(schema.emails.id, id));
    if (email && !email.openedAt) {
      await db.update(schema.emails).set({ openedAt: new Date() }).where(eq(schema.emails.id, id));
      if (email.contactId) {
        await db.insert(schema.activities).values({
          workspaceId: email.workspaceId, userId: "system", type: "email", contactId: email.contactId,
          subject: email.subject, body: `Opened email: "${email.subject}"`,
        }).catch(() => {});
        const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, email.contactId));
        if (contact) await runWorkflows(email.workspaceId, "email_opened", "contact", contact, {}).catch(() => {});
      }
    }
  } catch { /* never fail the pixel */ }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Content-Length": String(PIXEL.length),
    },
  });
}
