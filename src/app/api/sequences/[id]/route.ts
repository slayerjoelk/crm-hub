import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and, asc } from "drizzle-orm";

// GET /api/sequences/[id] — get with steps + enrollments
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const [seq] = await db
        .select()
        .from(schema.sequences)
        .where(and(eq(schema.sequences.id, id), eq(schema.sequences.workspaceId, workspaceId)));
      if (!seq) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const steps = await db
        .select()
        .from(schema.sequenceSteps)
        .where(eq(schema.sequenceSteps.sequenceId, id))
        .orderBy(asc(schema.sequenceSteps.stepNumber));

      const enrollments = await db
        .select()
        .from(schema.sequenceEnrollments)
        .where(eq(schema.sequenceEnrollments.sequenceId, id));

      return NextResponse.json({ success: true, data: { ...seq, steps, enrollments } });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to load sequence" }, { status: 500 });
    }
  });
}

// PATCH /api/sequences/[id] — update status/name
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const body = await req.json();
      const update: Record<string, any> = {};
      if (body.name !== undefined) update.name = body.name;
      if (body.description !== undefined) update.description = body.description;
      if (body.status !== undefined) update.status = body.status;
      update.updatedAt = new Date();

      await db
        .update(schema.sequences)
        .set(update)
        .where(and(eq(schema.sequences.id, id), eq(schema.sequences.workspaceId, workspaceId)));

      const [item] = await db
        .select()
        .from(schema.sequences)
        .where(eq(schema.sequences.id, id));
      return NextResponse.json({ success: true, data: item });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
  });
}

// DELETE /api/sequences/[id]
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      await db
        .delete(schema.sequences)
        .where(and(eq(schema.sequences.id, id), eq(schema.sequences.workspaceId, workspaceId)));
      return NextResponse.json({ success: true });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
  });
}
