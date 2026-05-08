import { type NextRequest, NextResponse } from "next/server";
import { processSequences } from "@/lib/automation/sequence-engine";
import { withWorkspace } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const stats = await processSequences(workspaceId);
      return NextResponse.json({ success: true, data: stats });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Sequence processing failed" }, { status: 500 });
    }
  });
}
