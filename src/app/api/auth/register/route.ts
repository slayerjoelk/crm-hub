import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { withRateLimit } from "@/lib/rate-limit";

async function seedWorkspace(workspaceId: string, userId: string) {
  const steps: string[] = [];

  // Pipeline
  const [pipeline] = await db.insert(schema.pipelines).values({
    workspaceId, name: "Sales Pipeline", description: "Default pipeline", isDefault: true, color: "#5e6ad2",
  }).returning();

  const stages = [
    { name: "New Lead", order: 0, color: "#64748b", prob: 10 },
    { name: "Contacted", order: 1, color: "#3b82f6", prob: 25 },
    { name: "Qualified", order: 2, color: "#f59e0b", prob: 50 },
    { name: "Proposal", order: 3, color: "#8b5cf6", prob: 70 },
    { name: "Negotiation", order: 4, color: "#ec4899", prob: 85 },
    { name: "Closed Won", order: 5, color: "#10b981", prob: 100 },
    { name: "Closed Lost", order: 6, color: "#ef4444", prob: 0 },
  ];
  for (const s of stages) {
    await db.insert(schema.pipelineStages).values({
      pipelineId: pipeline.id, name: s.name, displayOrder: s.order, color: s.color, winProbability: s.prob,
    });
  }
  steps.push("Pipeline: 7 stages");

  // Welcome sequence
  const [sequence] = await db.insert(schema.sequences).values({
    workspaceId, userId: userId, name: "Welcome Sequence",
    description: "Auto-enrolled on new lead capture", status: "active", type: "cold_outreach",
  }).returning();

  const emails = [
    { sub: "Welcome! Let's get started", body: "Hey {{firstName}},\n\nThanks for signing up. We are excited to have you on board.\n\nReply to this email if you have any questions - we read every response.\n\n-Best,\nThe Team", d: 0, h: 1 },
    { sub: "Checking in - how are things?", body: "Hi {{firstName}},\n\nQuick check-in to see how your first few days have been.\n\nAny questions? Just reply to this email.\n\n-Cheers,\nThe Team", d: 2, h: 0 },
    { sub: "What you might be missing", body: "Hey {{firstName}},\n\nHere are 3 things our most successful users do:\n\n1. Set up pipeline stages\n2. Create email sequences\n3. Add team members\n\nNeed help with any of these? Reply here.\n\n-Best,\nThe Team", d: 5, h: 0 },
    { sub: "Last email - here if you need us", body: "Hi {{firstName}},\n\nThis is our last automated email. No pressure - we are here whenever you are ready.\n\nJust reply to re-engage or book a call anytime.\n\n-Wishing you success,\nThe Team", d: 8, h: 0 },
  ];
  for (let i = 0; i < emails.length; i++) {
    await db.insert(schema.sequenceSteps).values({
      sequenceId: sequence.id, stepNumber: i,
      subject: emails[i].sub, body: emails[i].body,
      delayDays: emails[i].d, delayHours: emails[i].h, status: "active",
    });
  }
  steps.push("Sequence: 4 emails");

  // Tags
  const tags = ["Hot Lead", "Cold", "Follow Up", "Partner", "VIP", "Enterprise"];
  for (const name of tags) {
    await db.insert(schema.tags).values({ workspaceId, name, color: "#3b82f6" });
  }
  steps.push(`${tags.length} tags`);

  return steps;
}

async function registerHandler(req: NextRequest) {
  try {
    const { email, password, name, workspaceSlug, workspaceName } = await req.json();
    if (!email || !password || !workspaceSlug) {
      return NextResponse.json({ error: "Email, password, and workspace slug are required" }, { status: 400 });
    }
    const existing = await db.select().from(schema.workspaces).where(eq(schema.workspaces.slug, workspaceSlug.toLowerCase().trim()));
    if (existing.length > 0) {
      return NextResponse.json({ error: "Workspace slug already in use" }, { status: 409 });
    }

    const [workspace] = await db.insert(schema.workspaces).values({
      slug: workspaceSlug.toLowerCase().trim(), name: workspaceName ?? workspaceSlug, plan: "free", status: "active",
    }).returning();

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(schema.users).values({
      workspaceId: workspace.id, email: email.toLowerCase().trim(), name: name ?? email.split("@")[0], passwordHash, role: "owner", status: "active",
    }).returning();

    let seedSteps: string[] = [];
    try { seedSteps = await seedWorkspace(workspace.id, user.id); } catch {}

    const token = await createToken({ userId: user.id, email: user.email, workspaceId: workspace.id, role: user.role });
    await db.insert(schema.sessions).values({ userId: user.id, token, expiresAt: new Date(Date.now() + 7 * 86400000) });

    const res = NextResponse.json({ user, workspace, seed: seedSteps });
    res.cookies.set("session", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 7 * 86400, path: "/",
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

export const POST = withRateLimit(registerHandler, { keyPrefix: "register", windowMs: 5 * 60000, maxRequests: 5 });
