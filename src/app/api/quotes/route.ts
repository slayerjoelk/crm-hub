import { type NextRequest, NextResponse } from "next/server";
import { db, schema, ensureTables } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, desc } from "drizzle-orm";

function computeTotals(items: any[], discountPercent = 0, taxPercent = 0) {
  let subtotal = 0;
  const lines = items.map((it, i) => {
    const qty = Number(it.quantity ?? 1);
    const price = Number(it.unitPrice ?? 0);
    const disc = Number(it.discountPercent ?? 0);
    const lineTotal = qty * price * (1 - disc / 100);
    subtotal += lineTotal;
    return { ...it, quantity: qty, unitPrice: price, discountPercent: disc, lineTotal, displayOrder: i };
  });
  const afterDiscount = subtotal * (1 - Number(discountPercent) / 100);
  const total = afterDiscount * (1 + Number(taxPercent) / 100);
  return { lines, subtotal, total };
}

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      await ensureTables();
      const rows = await db.select().from(schema.quotes)
        .where(eq(schema.quotes.workspaceId, workspaceId)).orderBy(desc(schema.quotes.createdAt));
      const allItems = await db.select().from(schema.quoteLineItems);
      const data = rows.map(q => ({ ...q, lineCount: allItems.filter(li => li.quoteId === q.id).length }));
      return NextResponse.json({ data });
    } catch { return NextResponse.json({ error: "Failed to load quotes" }, { status: 500 }); }
  });
}

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      await ensureTables();
      const b = await req.json();
      if (!b.name) return NextResponse.json({ error: "name is required" }, { status: 400 });
      const { lines, subtotal, total } = computeTotals(b.lineItems || [], b.discountPercent || 0, b.taxPercent || 0);

      // Per-workspace quote number, retried on the UNIQUE(workspace_id, quote_number) index.
      let quote: any = null;
      for (let attempt = 0; attempt < 5 && !quote; attempt++) {
        const all = await db.select({ n: schema.quotes.quoteNumber }).from(schema.quotes).where(eq(schema.quotes.workspaceId, workspaceId));
        const nextNum = all.reduce((m, r) => Math.max(m, r.n || 0), 0) + 1 + attempt;
        try {
          [quote] = await db.insert(schema.quotes).values({
            workspaceId, quoteNumber: nextNum, name: b.name,
            dealId: b.dealId || null, contactId: b.contactId || null, companyId: b.companyId || null,
            status: b.status || "draft", currency: b.currency || "USD",
            discountPercent: Number(b.discountPercent) || 0, taxPercent: Number(b.taxPercent) || 0,
            subtotal, total, validUntil: b.validUntil ? new Date(b.validUntil) : null, notes: b.notes || null,
          }).returning();
        } catch (e: any) {
          if (!/unique|constraint/i.test(e?.message || "")) throw e;
        }
      }
      if (!quote) return NextResponse.json({ error: "Could not allocate quote number" }, { status: 500 });

      for (const li of lines) {
        await db.insert(schema.quoteLineItems).values({
          quoteId: quote.id, productId: li.productId || null, name: li.name,
          quantity: li.quantity, unitPrice: li.unitPrice, discountPercent: li.discountPercent,
          lineTotal: li.lineTotal, displayOrder: li.displayOrder,
        });
      }
      return NextResponse.json({ data: { ...quote, lineItems: lines } }, { status: 201 });
    } catch { return NextResponse.json({ error: "Failed to create quote" }, { status: 500 }); }
  });
}
