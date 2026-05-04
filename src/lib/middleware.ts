import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export interface WorkspaceContext {
  workspaceId: string;
  userId: string;
  role: string;
}

export async function withWorkspace(
  req: NextRequest,
  handler: (ctx: WorkspaceContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const workspaceId = req.headers.get("x-workspace-id");
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");

  if (!workspaceId || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handler({ workspaceId, userId, role: role || "member" });
}
