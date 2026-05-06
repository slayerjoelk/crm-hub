import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { withRateLimit } from "@/lib/rate-limit";

async function loginHandler(req: NextRequest) {
  try {
    const { email, password, workspaceSlug } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Resolve workspace
    let workspaceId: string | undefined;
    if (workspaceSlug) {
      const ws = await db
        .select()
        .from(schema.workspaces)
        .where(eq(schema.workspaces.slug, workspaceSlug.toLowerCase().trim()));
      workspaceId = ws[0]?.id;
    }

    // Build conditions
    const conditions: any[] = [eq(schema.users.email, email.toLowerCase().trim())];
    if (workspaceId) {
      conditions.push(eq(schema.users.workspaceId, workspaceId));
    }

    const users = await db
      .select()
      .from(schema.users)
      .where(and(...conditions));

    const user = users[0];
    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash ?? "");
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      workspaceId: user.workspaceId,
      role: user.role,
    });

    const workspaceRows = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, user.workspaceId));
    const workspace = workspaceRows[0];

    const response = NextResponse.json({ success: true, data: { user, workspace } });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Login failed" }, { status: 500 });
  }
}

export const POST = withRateLimit(loginHandler);
