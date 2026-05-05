import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and, inArray } from "drizzle-orm";

// POST /api/sequences/[id]/enroll — enroll contacts into sequence
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const [seq] = await db
        .select()
        .from(schema.sequences)
        .where(and(eq(schema.sequences.id, id), eq(schema.sequences.workspaceId, workspaceId)));
      if (!seq) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const body = await req.json();
      const contactIds: string[] = Array.isArray(body.contactIds) ? body.contactIds : [];
      if (contactIds.length === 0) return NextResponse.json({ error: "No contacts selected" }, { status: 400 });

      // Verify all contacts belong to workspace
      const contactRows = await db
        .select({ id: schema.contacts.id })
        .from(schema.contacts)
        .where(and(
          eq(schema.contacts.workspaceId, workspaceId),
          inArray(schema.contacts.id, contactIds)
        ));
      const validIds = contactRows.map((c) => c.id);

      // Skip already enrolled
      const existing = await db
        .select()
        .from(schema.sequenceEnrollments)
        .where(eq(schema.sequenceEnrollments.sequenceId, id));
      const existingIds = new Set(existing.map((e) => e.contactId));

      const toInsert = validIds.filter((cid) => !existingIds.has(cid));
      if (toInsert.length === 0) {
        return NextResponse.json({ success: true, data: { enrolled: 0, skipped: 0 } });
      }

      const rows = toInsert.map((contactId: string) => ({
        sequenceId: id,
        contactId,
        status: "active" as const,
        currentStep: 0,
      }));

      await db.insert(schema.sequenceEnrollments).values(rows);

      return NextResponse.json({ success: true, data: { enrolled: toInsert.length, skipped: validIds.length - toInsert.length } });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Failed to enroll" }, { status: 500 });
    }
  });
}

// DELETE /api/sequences/[id]/enroll — remove enrollment by enrollmentId
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const [seq] = await db
        .select()
        .from(schema.sequences)
        .where(and(eq(schema.sequences.id, id), eq(schema.sequences.workspaceId, workspaceId)));
      if (!seq) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const body = await req.json().catch(() => ({}));
      const enrollmentId = body.enrollmentId;
      if (!enrollmentId) return NextResponse.json({ error: "Missing enrollmentId" }, { status: 400 });

      // Verify enrollment belongs to this sequence
      const [enrollment] = await db
        .select()
        .from(schema.sequenceEnrollments)
        .where(and(
          eq(schema.sequenceEnrollments.id, enrollmentId),
          eq(schema.sequenceEnrollments.sequenceId, id)
        ));
      if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

      await db
        .delete(schema.sequenceEnrollments)
        .where(eq(schema.sequenceEnrollments.id, enrollmentId));

      return NextResponse.json({ success: true });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Failed to unenroll" }, { status: 500 });
    }
  });
}
