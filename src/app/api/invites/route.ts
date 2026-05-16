import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq, and } from "drizzle-orm";
import { Resend } from "resend";
import { randomBytes } from "crypto";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function randomToken(): string {
  return randomBytes(16).toString("hex");
}

function sendInviteEmail(to: string, inviteUrl: string) {
  if (!resend) return;
  resend.emails.send({
    from: process.env.FROM_EMAIL || "invites@crm-hub.dev",
    to,
    subject: "You're invited to join a workspace",
    html: `<p>You've been invited to join a CRM workspace.</p><p><a href="${inviteUrl}">Accept Invite</a></p><p>Or copy: ${inviteUrl}</p>`,
  }).catch(() => null);
}

export async function POST(req: NextRequest) {
  return withWorkspace(req, async ({ workspaceId, userId }) => {
    const body = await req.json();
    const email = (body.email || "").toLowerCase().trim();
    const role = body.role || "member";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    // Prevent duplicate invite
    const existing = await db
      .select()
      .from(schema.invites)
      .where(and(eq(schema.invites.workspaceId, workspaceId), eq(schema.invites.email, email)));
    if (existing.length > 0) {
      return NextResponse.json({ error: "Invite already sent to this email" }, { status: 409 });
    }
    // Prevent invite to existing member
    const member = await db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.workspaceId, workspaceId), eq(schema.users.email, email)));
    if (member.length > 0) {
      return NextResponse.json({ error: "User already in workspace" }, { status: 409 });
    }
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const token = randomToken();
    const [invite] = await db
      .insert(schema.invites)
      .values({
        workspaceId,
        email,
        role,
        token,
        invitedBy: userId,
        expiresAt,
      })
      .returning();
    sendInviteEmail(email, `${appUrl}/invite/${token}`);
    return NextResponse.json({ data: invite });
  });
}
