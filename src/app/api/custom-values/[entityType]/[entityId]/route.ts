import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and } from "drizzle-orm";

// GET /api/custom-values/:entityType/:entityId
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const { entityType, entityId } = await params;
      const properties = await db
        .select()
        .from(schema.customProperties)
        .where(
          and(
            eq(schema.customProperties.workspaceId, workspaceId),
            eq(schema.customProperties.entityType, entityType as any)
          )
        );
      const values = await db
        .select()
        .from(schema.customPropertyValues)
        .where(eq(schema.customPropertyValues.entityId, entityId));
      const merged = properties.map((prop) => {
        const row = values.find((v) => v.propertyId === prop.id);
        return { ...prop, value: row?.value ?? null };
      });
      return NextResponse.json({ data: merged });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to load custom values" }, { status: 500 });
    }
  });
}

// POST /api/custom-values/:entityType/:entityId
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  return withWorkspace(req, async ({ workspaceId }) => {
    try {
      const { entityType, entityId } = await params;
      const body = await req.json(); // { [propertyId]: value }
      const entries = Object.entries(body) as [string, string][];
      for (const [propertyId, value] of entries) {
        await db
          .insert(schema.customPropertyValues)
          .values({ propertyId, entityId, value })
          .onConflictDoUpdate({
            target: [schema.customPropertyValues.propertyId, schema.customPropertyValues.entityId],
            set: { value },
          });
      }
      // re-fetch
      const properties = await db
        .select()
        .from(schema.customProperties)
        .where(
          and(
            eq(schema.customProperties.workspaceId, workspaceId),
            eq(schema.customProperties.entityType, entityType as any)
          )
        );
      const values = await db
        .select()
        .from(schema.customPropertyValues)
        .where(eq(schema.customPropertyValues.entityId, entityId));
      const merged = properties.map((prop) => {
        const row = values.find((v) => v.propertyId === prop.id);
        return { ...prop, value: row?.value ?? null };
      });
      return NextResponse.json({ data: merged });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to save custom values" }, { status: 500 });
    }
  });
}
