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
  let workspaceId = req.headers.get("x-workspace-id");
  let userId = req.headers.get("x-user-id");
  let role = req.headers.get("x-user-role");

  // Fallback to session cookie if middleware headers are absent
  if (!workspaceId || !userId) {
    const token = req.cookies.get("session")?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        workspaceId = payload.workspaceId;
        userId = payload.userId;
        role = payload.role;
      }
    }
  }

  if (!workspaceId || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handler({ workspaceId, userId, role: role || "member" });
}
