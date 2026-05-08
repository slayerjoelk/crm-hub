import { type NextRequest, NextResponse } from "next/server";
import { scoreContact, scoreAllInWorkspace } from "@/lib/automation/lead-scoring";
import { withWorkspace } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const body = await req.json().catch(() => ({}));
      const contactId = body.contactId as string | undefined;

      if (contactId) {
        const result = await scoreContact(contactId);
        return NextResponse.json({ success: true, data: result });
      }

      const count = await scoreAllInWorkspace(workspaceId);
      return NextResponse.json({ success: true, data: { scored: count } });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Scoring failed" }, { status: 500 });
    }
  });
}

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const { searchParams } = new URL(req.url);
      const contactId = searchParams.get("contactId");

      if (contactId) {
        const result = await scoreContact(contactId);
        return NextResponse.json({ success: true, data: result });
      }

      const count = await scoreAllInWorkspace(workspaceId);
      return NextResponse.json({ success: true, data: { scored: count } });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Scoring failed" }, { status: 500 });
    }
  });
}
