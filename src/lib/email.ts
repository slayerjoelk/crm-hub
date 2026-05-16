import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "your-resend-api-key" || apiKey === "your-resend-api-key") return null;
  _resend = new Resend(apiKey);
  return _resend;
}

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
  success: boolean;
  id?: string;
  error?: string;
}> {
  const resend = getResend();
  const fromEmail = params.from || process.env.EMAIL_FROM || process.env.FROM_EMAIL || "CRM Hub <crm@yourdomain.com>";

  if (!resend) {
    return { success: false, error: "Resend not configured (RESEND_API_KEY missing)" };
  }

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || params.html.replace(/<[^>]*>/g, ""),
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (e: any) {
    return { success: false, error: e.message || "Resend send failed" };
  }
}
