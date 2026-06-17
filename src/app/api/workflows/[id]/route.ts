import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and, desc } from "drizzle-orm";

// GET /api/workflows/:id — workflow + recent executions
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const [wf] = await db.select().from(schema.workflows)
      .where(and(eq(schema.workflows.id, id), eq(schema.workflows.workspaceId, workspaceId)));
    if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const executions = await db.select().from(schema.workflowExecutions)
      .where(eq(schema.workflowExecutions.workflowId, id))
      .orderBy(desc(schema.workflowExecutions.createdAt))
      .limit(50);
    return NextResponse.json({ data: {
      ...wf,
      triggerConfig: safeParse(wf.triggerConfig, {}),
      conditions: safeParse(wf.conditions, []),
      actions: safeParse(wf.actions, []),
      executions: executions.map((e) => ({ ...e, actionsRun: safeParse(e.actionsRun, []) })),
    } });
  });
}

// PATCH /api/workflows/:id — update (incl. activate/pause via status)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    const body = await req.json();
    const patch: Record<string, any> = { updatedAt: new Date() };
    for (const k of ["name", "description", "status", "triggerType", "allowReenrollment"]) {
      if (k in body) patch[k] = body[k];
    }
    if ("triggerConfig" in body) patch.triggerConfig = JSON.stringify(body.triggerConfig);
    if ("conditions" in body) patch.conditions = JSON.stringify(body.conditions);
    if ("actions" in body) patch.actions = JSON.stringify(body.actions);
    const [item] = await db.update(schema.workflows).set(patch)
      .where(and(eq(schema.workflows.id, id), eq(schema.workflows.workspaceId, workspaceId))).returning();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: item });
  });
}

// DELETE /api/workflows/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withWorkspace(req, async ({ workspaceId }) => {
    const id = (await params).id;
    await db.delete(schema.workflows).where(and(eq(schema.workflows.id, id), eq(schema.workflows.workspaceId, workspaceId)));
    return NextResponse.json({ data: { success: true } });
  });
}

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
