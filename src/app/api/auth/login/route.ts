import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
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

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db
      .insert(schema.sessions)
      .values({
        userId: user.id,
        token,
        expiresAt,
      });

    const res = NextResponse.json({ user });
    res.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("Login error:", err?.message || err);
    console.error("Login error stack:", err?.stack);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
