import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";

// GET /api/businesses
// Returns all businesses the current user has access to (via workspace membership)
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    // Find all workspaces this user belongs to
    const userWorkspaces = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, payload.userId));

    const workspaceIds = userWorkspaces.map(u => u.workspaceId);
    if (workspaceIds.length === 0) return NextResponse.json({ data: [] });

    const workspaces = await db
      .select()
      .from(schema.workspaces)
      .where(inArray(schema.workspaces.id, workspaceIds));

    const businessIds = workspaces
      .map(w => w.businessId)
      .filter((id): id is string => !!id);

    if (businessIds.length === 0) return NextResponse.json({ data: [] });

    const businesses = await db
      .select()
      .from(schema.businesses)
      .where(inArray(schema.businesses.id, businessIds));

    return NextResponse.json({ data: businesses });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to load businesses" }, { status: 500 });
  }
}
