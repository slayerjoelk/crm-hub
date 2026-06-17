import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, desc } from "drizzle-orm";
import { Resend } from "resend";
import { injectTracking } from "@/lib/email-tracking";

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
      const baseHtml = htmlBody || (textBody ? `<p>${String(textBody).replace(/\n/g, "<br>")}</p>` : undefined);

      // Insert first so we have the row id to build tracking links/pixel against
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
          htmlBody: baseHtml || null,
          contactId: contactId || null,
          dealId: dealId || null,
          provider: "resend",
          direction: "outbound",
          deliveryStatus: "pending",
        })
        .returning();

      if (sendNow && resend) {
        const trackedHtml = baseHtml ? injectTracking(baseHtml, item.id) : undefined;
        const result = await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: toEmail,
          subject,
          text: textBody || "",
          html: trackedHtml,
        });
        if (result.error) {
          await db.update(schema.emails).set({ deliveryStatus: "failed", error: result.error.message }).where(eq(schema.emails.id, item.id));
          return NextResponse.json({ error: result.error.message }, { status: 500 });
        }
        await db.update(schema.emails).set({ deliveryStatus: "sent", providerMessageId: result.data?.id || null, sentAt: new Date() }).where(eq(schema.emails.id, item.id));
        item.deliveryStatus = "sent";
        item.sentAt = new Date();
      }

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
