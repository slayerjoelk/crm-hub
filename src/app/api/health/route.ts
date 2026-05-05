import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    await db.select({ id: schema.workspaces.id }).from(schema.workspaces).limit(1);
    return NextResponse.json({ ok: true, uptime: process.uptime() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
