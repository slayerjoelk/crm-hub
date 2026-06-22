import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq } from "drizzle-orm";

// GET /api/sequences/enrollments — enrollments for THIS workspace (optionally filtered)
export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const { searchParams } = new URL(req.url);
      const contactId = searchParams.get("contactId");
      const sequenceId = searchParams.get("sequenceId");

      // Scope to this workspace: only enrollments whose contact belongs here.
      const wsContacts = await db.select({ id: schema.contacts.id, email: schema.contacts.email })
        .from(schema.contacts).where(eq(schema.contacts.workspaceId, workspaceId));
      const contactMap: Record<string, string> = {};
      const allowedContactIds = new Set<string>();
      for (const c of wsContacts) { contactMap[c.id] = c.email || ""; allowedContactIds.add(c.id); }

      let enrollments = await db.select().from(schema.sequenceEnrollments);
      enrollments = enrollments.filter(e => allowedContactIds.has(e.contactId));
      if (contactId) enrollments = enrollments.filter(e => e.contactId === contactId);
      if (sequenceId) enrollments = enrollments.filter(e => e.sequenceId === sequenceId);

      const data = enrollments.map(e => ({ ...e, contactEmail: contactMap[e.contactId] || "" }));
      return NextResponse.json({ success: true, data });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to load enrollments" }, { status: 500 });
    }
  });
}
