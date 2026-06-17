import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const body = await req.json();
  const patch: Record<string, any> = { updatedAt: new Date() };
  for (const k of ["name", "domain", "plan", "status"]) if (k in body) patch[k] = body[k];
  const [item] = await db.update(schema.businesses).set(patch).where(eq(schema.businesses.id, id)).returning();
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: item });
}

// Soft-delete (archive) — keeps the underlying workspace + data intact
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  await db.update(schema.businesses).set({ status: "archived", updatedAt: new Date() }).where(eq(schema.businesses.id, id));
  return NextResponse.json({ data: { success: true } });
}
