import { type NextRequest, NextResponse } from "next/server";
import { db, schema, ensureTables } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      await ensureTables();
      const rows = await db.select().from(schema.products)
        .where(eq(schema.products.workspaceId, workspaceId)).orderBy(desc(schema.products.createdAt));
      return NextResponse.json({ data: rows });
    } catch { return NextResponse.json({ error: "Failed to load products" }, { status: 500 }); }
  });
}

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      await ensureTables();
      const b = await req.json();
      if (!b.name) return NextResponse.json({ error: "name is required" }, { status: 400 });
      const [item] = await db.insert(schema.products).values({
        workspaceId, name: b.name, sku: b.sku || null, description: b.description || null,
        unitPrice: b.unitPrice ? Number(b.unitPrice) : 0, currency: b.currency || "USD",
        category: b.category || null, billingPeriod: b.billingPeriod || "one_time",
        isActive: b.isActive !== false,
      }).returning();
      return NextResponse.json({ data: item }, { status: 201 });
    } catch { return NextResponse.json({ error: "Failed to create product" }, { status: 500 }); }
  });
}
