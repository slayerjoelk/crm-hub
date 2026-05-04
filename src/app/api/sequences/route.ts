import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and, desc } from "drizzle-orm";

// GET /api/sequences — list with step count
export async function GET(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const seqs = await db
        .select()
        .from(schema.sequences)
        .where(eq(schema.sequences.workspaceId, workspaceId))
        .orderBy(desc(schema.sequences.createdAt));
      // Count steps + enrollments per sequence
      const steps = await db.select().from(schema.sequenceSteps);
      const enrollments = await db.select().from(schema.sequenceEnrollments);
      const data = seqs.map((s) => ({
        ...s,
        stepCount: steps.filter((st) => st.sequenceId === s.id).length,
        enrolledCount: enrollments.filter((e) => e.sequenceId === s.id).length,
      }));
      return NextResponse.json({ success: true, data });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to load sequences" }, { status: 500 });
    }
  });
}

// POST /api/sequences — create
export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId, userId }) => {
    try {
      const body = await req.json();
      const [item] = await db.insert(schema.sequences).values({
        workspaceId,
        userId,
        name: body.name,
        description: body.description || null,
        type: body.type || "cold_outreach",
        status: body.status || "draft",
      }).returning();
      return NextResponse.json({ success: true, data: item });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to create sequence" }, { status: 500 });
    }
  });
}
