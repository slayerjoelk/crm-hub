import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, desc } from "drizzle-orm";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const list = await db
        .select()
        .from(schema.emails)
        .where(eq(schema.emails.workspaceId, workspaceId))
        .orderBy(desc(schema.emails.createdAt))
        .limit(50);
      return NextResponse.json({ success: true, data: list });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to load emails" }, { status: 500 });
    }
  });
}

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId, userId }) => {
    try {
      const body = await req.json();
      const {
        toEmail,
        toName,
        subject,
        textBody,
        htmlBody,
        contactId,
        dealId,
        sendNow,
      } = body;

      if (!toEmail || !subject) {
        return NextResponse.json({ error: "toEmail and subject are required" }, { status: 400 });
      }

      const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
      const fromName = process.env.FROM_NAME || "CRM Hub";

      let providerMessageId: string | undefined;
      let sentAt: Date | undefined;

      if (sendNow && resend) {
        const result = await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: toEmail,
          subject,
          text: textBody || "",
          html: htmlBody || undefined,
        });
        if (result.error) {
          return NextResponse.json({ error: result.error.message }, { status: 500 });
        }
        providerMessageId = result.data?.id;
        sentAt = new Date();
      }

      const [item] = await db
        .insert(schema.emails)
        .values({
          workspaceId,
          fromEmail,
          fromName,
          toEmail,
          toName: toName || null,
          subject,
          textBody: textBody || null,
          htmlBody: htmlBody || null,
          contactId: contactId || null,
          dealId: dealId || null,
          sentAt: sentAt || null,
          provider: "resend",
          providerMessageId: providerMessageId || null,
          direction: "outbound",
        })
        .returning();

      // Log activity
      await db.insert(schema.activities).values({
        workspaceId,
        userId: userId || "system",
        type: "email",
        contactId: contactId || null,
        dealId: dealId || null,
        subject,
        body: `Email sent to ${toEmail}: ${subject}`,
      });

      return NextResponse.json({ success: true, data: item });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Failed to send email" }, { status: 500 });
    }
  });
}
