import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and, count } from "drizzle-orm";

// POST /api/sequences/[id]/steps — add step
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

      // Determine next step number
      const existing = await db
        .select()
        .from(schema.sequenceSteps)
        .where(eq(schema.sequenceSteps.sequenceId, id));
      const nextNumber = existing.length + 1;

      const [item] = await db
        .insert(schema.sequenceSteps)
        .values({
          sequenceId: id,
          stepNumber: nextNumber,
          subject: body.subject,
          body: body.body || "",
          delayDays: body.delayDays ?? 1,
          delayHours: body.delayHours ?? 0,
          status: body.status || "draft",
        })
        .returning();

      return NextResponse.json({ success: true, data: item });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to add step" }, { status: 500 });
    }
  });
}
