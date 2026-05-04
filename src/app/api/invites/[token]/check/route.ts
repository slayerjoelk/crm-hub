import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;

  const invite = await db
    .select({
      id: schema.invites.id,
      email: schema.invites.email,
      role: schema.invites.role,
      expiresAt: schema.invites.expiresAt,
      workspaceName: schema.workspaces.name,
    })
    .from(schema.invites)
    .leftJoin(schema.workspaces, eq(schema.invites.workspaceId, schema.workspaces.id))
    .where(and(eq(schema.invites.token, token), gt(schema.invites.expiresAt, new Date())))
    .limit(1)
    .then(rows => rows[0] ?? null);

  if (!invite) {
    return NextResponse.json({ error: "This invite link has expired or is invalid." }, { status: 410 });
  }

  return NextResponse.json({ data: invite });
}
