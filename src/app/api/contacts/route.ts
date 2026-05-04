import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const { searchParams } = new URL(req.url);
      const q = searchParams.get("q");
      const companyId = searchParams.get("companyId");
      let list = await db.select().from(schema.contacts).where(eq(schema.contacts.workspaceId, workspaceId)).orderBy(desc(schema.contacts.createdAt));
      if (companyId) list = list.filter(c => c.companyId === companyId);
      if (q) {
        const lower = q.toLowerCase();
        list = list.filter(c => (c.firstName+" "+c.lastName).toLowerCase().includes(lower)||(c.email||"").toLowerCase().includes(lower)||(c.phone||"").toLowerCase().includes(lower));
      }
      return NextResponse.json({ data: list });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to load contacts" }, { status: 500 });
    }
  });
}

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const body = await req.json();
      const data = { ...body, workspaceId };
      if (!data.lifecycleStage) data.lifecycleStage = "subscriber";
      if (!data.leadStatus) data.leadStatus = "new";
      const [item] = await db.insert(schema.contacts).values(data).returning();
      await db.insert(schema.activities).values({ workspaceId, userId: "system", type: "contact_created", contactId: item.id, body: `Contact ${data.firstName ?? ""} ${data.lastName ?? ""} created.` });
      return NextResponse.json({ data: item });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
    }
  });
}
