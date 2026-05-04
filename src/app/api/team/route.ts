import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and, gt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const members = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.workspaceId, workspaceId));
    const invites = await db
      .select()
      .from(schema.invites)
      .where(and(eq(schema.invites.workspaceId, workspaceId), gt(schema.invites.expiresAt, new Date())));
    return NextResponse.json({ data: { members, invites } });
  });
}
