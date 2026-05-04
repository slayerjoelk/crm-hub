import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, or, like, desc, sql, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const { q } = await req.json();
      const query = (q || "").toLowerCase().trim();
      if (!query || query.length < 2) {
        return NextResponse.json({ data: [] });
      }

      const qLike = `%${query}%`;
      const limit = 8;

      const contacts = await db
        .select({ id: schema.contacts.id, name: sql<string>`${schema.contacts.firstName} || ' ' || ${schema.contacts.lastName}`, email: schema.contacts.email, type: sql<string>`'contact'` })
        .from(schema.contacts)
        .where(and(eq(schema.contacts.workspaceId, workspaceId), or(like(sql`lower(${schema.contacts.firstName})`, qLike), like(sql`lower(${schema.contacts.lastName})`, qLike), like(sql`lower(${schema.contacts.email})`, qLike))))
        .limit(limit);

      const companies = await db
        .select({ id: schema.companies.id, name: schema.companies.name, email: sql<string>`''`, type: sql<string>`'company'` })
        .from(schema.companies)
        .where(and(eq(schema.companies.workspaceId, workspaceId), like(sql`lower(${schema.companies.name})`, qLike)))
        .limit(limit);

      const deals = await db
        .select({ id: schema.deals.id, name: schema.deals.name, email: sql<string>`''`, type: sql<string>`'deal'` })
        .from(schema.deals)
        .where(and(eq(schema.deals.workspaceId, workspaceId), like(sql`lower(${schema.deals.name})`, qLike)))
        .limit(limit);

      const tasks = await db
        .select({ id: schema.tasks.id, name: schema.tasks.title, email: sql<string>`''`, type: sql<string>`'task'` })
        .from(schema.tasks)
        .where(and(eq(schema.tasks.workspaceId, workspaceId), like(sql`lower(${schema.tasks.title})`, qLike)))
        .limit(limit);

      const results = [...contacts, ...companies, ...deals, ...tasks];
      return NextResponse.json({ data: results.slice(0, 16) });
    } catch (e: any) {
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
  });
}
