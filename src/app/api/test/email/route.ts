import { type NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { withWorkspace } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId, role }) => {
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      const body = await req.json();
      const { to, subject, html, text } = body;

      if (!to || !subject) {
        return NextResponse.json({ error: "to and subject are required" }, { status: 400 });
      }

      const result = await sendEmail({
        to,
        subject,
        html: html || `<p>This is a test email from CRM Hub.</p>`,
        text: text || "This is a test email from CRM Hub.",
        workspaceId,
      });

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      return NextResponse.json({ success: true, messageId: result.id });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Test email failed" }, { status: 500 });
    }
  });
}
