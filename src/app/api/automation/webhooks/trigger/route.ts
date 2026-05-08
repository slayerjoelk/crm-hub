import { type NextRequest, NextResponse } from "next/server";
import { triggerWebhooks } from "@/lib/automation/webhooks";
import { withWorkspace } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const body = await req.json();
      const { event, entityType, entityId, data } = body;

      if (!event || !entityType || !entityId) {
        return NextResponse.json({ error: "event, entityType, and entityId required" }, { status: 400 });
      }

      const result = await triggerWebhooks(workspaceId, event, entityType, entityId, data || {});
      return NextResponse.json({ success: true, data: result });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Webhook dispatch failed" }, { status: 500 });
    }
  });
}
