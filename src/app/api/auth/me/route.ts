import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId));
  const [workspace] = await db.select().from(schema.workspaces).where(eq(schema.workspaces.id, payload.workspaceId));
  if (!user || !workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: { user, workspace } });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, any> = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.email !== undefined) updates.email = body.email.trim().toLowerCase();
  if (body.timezone !== undefined) updates.timezone = body.timezone;
  if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  updates.updatedAt = new Date();

  try {
    await db.update(schema.users).set(updates).where(eq(schema.users.id, payload.userId));
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId));
    return NextResponse.json({ data: user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Update failed" }, { status: 500 });
  }
}
