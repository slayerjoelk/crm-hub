import { type NextRequest, NextResponse } from "next/server";
import { autoCreateTasks } from "@/lib/automation/tasks";
import { withWorkspace } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const result = await autoCreateTasks(workspaceId);
      return NextResponse.json({ success: true, data: result });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Task automation failed" }, { status: 500 });
    }
  });
}
