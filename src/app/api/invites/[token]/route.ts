import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and } from "drizzle-orm";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).token;
    await db
      .delete(schema.invites)
      .where(and(eq(schema.invites.id, id), eq(schema.invites.workspaceId, workspaceId)));
    return NextResponse.json({ data: { success: true } });
  });
}
