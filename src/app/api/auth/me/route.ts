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
