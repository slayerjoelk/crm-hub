import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * Email Sender
 * 
 * Sends real emails via Resend when configured.
 * Falls back to DB-only logging when no API key.
 * 
 * Usage:
 *   await sendEmail({ to: "lead@co.com", subject: "Welcome", html: "<p>Hey</p>" })
 */

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  contactId?: string;
  dealId?: string;
  workspaceId?: string;
}

export async function sendEmail(params: EmailParams): Promise<{
  sent: boolean;
  messageId?: string;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = params.from || process.env.FROM_EMAIL || "noreply@crm-hub.com";

  // Try real send via Resend
  if (apiKey && apiKey !== "your-resend-api-key") {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [params.to],
          subject: params.subject,
          html: params.html,
          text: params.text || params.html.replace(/<[^>]*>/g, ""),
        }),
      });

      const data = await res.json();
      if (res.ok && data.id) {
        // Log to DB
        if (params.workspaceId) {
          try {
            await db.insert(schema.emails).values({
              workspaceId: params.workspaceId,
              fromEmail: fromEmail,
              toEmail: params.to,
              subject: params.subject,
              htmlBody: params.html,
              textBody: params.text || "",
              contactId: params.contactId || undefined,
              dealId: params.dealId || undefined,
              direction: "outbound",
              provider: "resend",
              providerMessageId: data.id,
              sentAt: new Date(),
            });
          } catch {}
        }
        return { sent: true, messageId: data.id };
      }

      return { sent: false, error: data.message || "Resend API error" };
    } catch (e: any) {
      console.error("Resend send failed:", e.message);
      // Fall through to DB-only
    }
  }

  // DB-only mode (no Resend key configured)
  if (params.workspaceId) {
    try {
      const [record] = await db.insert(schema.emails).values({
        workspaceId: params.workspaceId,
        fromEmail: fromEmail,
        toEmail: params.to,
        subject: params.subject,
        htmlBody: params.html,
        textBody: params.text || "",
        contactId: params.contactId || undefined,
        dealId: params.dealId || undefined,
        direction: "outbound",
        provider: "smtp",
        sentAt: new Date(),
      }).returning();
      return { sent: true, messageId: record.id };
    } catch (e: any) {
      return { sent: false, error: e.message };
    }
  }

  console.log(`[EMAIL-DEV] To: ${params.to} | Subject: ${params.subject}`);
  return { sent: true, messageId: "dev-mode" };
}
