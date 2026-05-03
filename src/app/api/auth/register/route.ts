import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "../../../lib/db";
import { hashPassword, createToken } from "../../../lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, workspaceSlug, workspaceName } = await req.json();

    if (!email || !password || !workspaceSlug) {
      return NextResponse.json({ error: "Email, password, and workspace slug are required" }, { status: 400 });
    }

    // Check if workspace slug already exists
    const existingWorkspace = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.slug, workspaceSlug.toLowerCase().trim()))
      .get();

    if (existingWorkspace) {
      return NextResponse.json({ error: "Workspace slug already in use" }, { status: 409 });
    }

    // Create workspace
    const workspace = await db
      .insert(schema.workspaces)
      .values({
        slug: workspaceSlug.toLowerCase().trim(),
        name: workspaceName ?? workspaceSlug,
        plan: "free",
        status: "active",
      })
      .returning()
      .get();

    // Create owner user
    const passwordHash = await hashPassword(password);
    const user = await db
      .insert(schema.users)
      .values({
        workspaceId: workspace.id,
        email: email.toLowerCase().trim(),
        name: name ?? email.split("@")[0],
        passwordHash,
        role: "owner",
        status: "active",
      })
      .returning()
      .get();

    // Create session
    const token = await createToken({
      userId: user.id,
      email: user.email,
      workspaceId: workspace.id,
      role: user.role,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db
      .insert(schema.sessions)
      .values({
        userId: user.id,
        token,
        expiresAt,
      })
      .get();

    // Set session cookie
    const res = NextResponse.json({ user, workspace });
    res.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
