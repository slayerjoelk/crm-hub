import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  const body = await req.json().catch(() => ({}));
  const name = (body.name || "").trim();
  const password = (body.password || "").trim();

  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const invite = await db
    .select()
    .from(schema.invites)
    .where(and(eq(schema.invites.token, token), gt(schema.invites.expiresAt, new Date())))
    .limit(1)
    .then(rows => rows[0] ?? null);

  if (!invite) {
    return NextResponse.json({ error: "Invite expired or invalid" }, { status: 410 });
  }

  // Idempotency: if user already exists with this email in this workspace, reuse
  const existing = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.workspaceId, invite.workspaceId), eq(schema.users.email, invite.email)))
    .limit(1)
    .then(rows => rows[0] ?? null);

  if (existing) {
    return NextResponse.json({ error: "User already exists in this workspace" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();

  const [user] = await db
    .insert(schema.users)
    .values({
      workspaceId: invite.workspaceId,
      email: invite.email,
      name,
      passwordHash,
      role: invite.role,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await db.delete(schema.invites).where(eq(schema.invites.id, invite.id));

  const jwt = await signToken({
    userId: user.id,
    email: user.email,
    workspaceId: user.workspaceId,
    role: user.role,
  });

  const res = NextResponse.json({
    data: {
      user,
      workspaceSlug: await getWorkspaceSlug(invite.workspaceId),
    },
  });

  res.cookies.set("session", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}

async function getWorkspaceSlug(workspaceId: string): Promise<string> {
  const ws = await db.select().from(schema.workspaces).where(eq(schema.workspaces.id, workspaceId)).limit(1);
  return ws[0]?.slug || "";
}
