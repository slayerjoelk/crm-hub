import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and } from "drizzle-orm";

// POST /api/campaigns/:id/members — add contacts to a campaign
// body: { contactIds: string[], status? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const { contactIds = [], status = "targeted" } = await req.json();
    const [c] = await db.select().from(schema.campaigns).where(and(eq(schema.campaigns.id, id), eq(schema.campaigns.workspaceId, workspaceId)));
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Only allow contacts that belong to THIS workspace
    const wsContacts = await db.select({ id: schema.contacts.id }).from(schema.contacts).where(eq(schema.contacts.workspaceId, workspaceId));
    const allowed = new Set(wsContacts.map(c => c.id));

    const existing = await db.select().from(schema.campaignMembers).where(eq(schema.campaignMembers.campaignId, id));
    const have = new Set(existing.map(m => m.contactId).filter(Boolean));
    let added = 0;
    for (const cid of contactIds) {
      if (have.has(cid) || !allowed.has(cid)) continue;
      await db.insert(schema.campaignMembers).values({ campaignId: id, contactId: cid, status });
      added++;
    }
    return NextResponse.json({ data: { added } }, { status: 201 });
  });
}
