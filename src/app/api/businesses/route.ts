import { type NextRequest, NextResponse } from "next/server";
import { db, schema, ensureTables } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "company";
}

// POST /api/businesses — provision a new SaaS company (business + primary workspace)
export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const body = await req.json();
    const name: string = (body.name || "").trim();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    let slug = slugify(body.slug || name);
    // Ensure unique business slug
    const existing = await db.select().from(schema.businesses);
    let n = 1;
    const base = slug;
    while (existing.some((b) => b.slug === slug)) slug = `${base}-${++n}`;

    const [biz] = await db.insert(schema.businesses).values({
      slug,
      name,
      domain: body.domain || null,
      plan: body.plan || "starter",
      status: "active",
    }).returning();

    // Primary workspace (unique slug across workspaces)
    const allWs = await db.select().from(schema.workspaces);
    let wsSlug = slug;
    let m = 1;
    while (allWs.some((w) => w.slug === wsSlug)) wsSlug = `${slug}-${++m}`;

    const [ws] = await db.insert(schema.workspaces).values({
      slug: wsSlug,
      name,
      businessId: biz.id,
      plan: body.plan || "starter",
      status: "active",
      primaryColor: body.primaryColor || "#5e6ad2",
    }).returning();

    return NextResponse.json({ data: { business: biz, workspace: ws, workspaceSlug: ws.slug } }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }
}

// GET /api/businesses
// Returns all businesses the current user has access to (via workspace membership)
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("session")?.value;
    const payload = token ? await verifyToken(token) : null;

    // Dev fallback (auth disabled): return all active businesses
    if (!payload) {
      if (process.env.REQUIRE_AUTH !== "true") {
        const all = await db.select().from(schema.businesses).where(eq(schema.businesses.status, "active"));
        return NextResponse.json({ data: all });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
