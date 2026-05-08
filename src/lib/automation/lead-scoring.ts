import { db, schema } from "@/lib/db";
import { eq, desc, sql, and, gte } from "drizzle-orm";

/* ────────────────────────────────────────────
   Lead Scoring Engine
   
   Scores contacts 0-100 based on:
   - Demographics (job title seniority, company info)
   - Behavioral (email opens, clicks, replies)
   - Engagement (activities, meeting recency)
   - Source quality (referral > organic > paid > cold)
   - Lifecycle fit (customer > lead > subscriber)
   
   Thresholds:
   - 0-30: Cold (nurture)
   - 31-60: Warm (qualify)
   - 61-80: Hot (contact)
   - 81-100: Ready (route to sales)
   ─────────────────────────────────────────── */

const SENIORITY_TITLES = [
  "ceo", "cto", "cfo", "coo", "cmo", "cio", "cro",
  "founder", "vp", "vice president", "director", "head of",
  "president", "managing director", "partner", "owner",
  "chief", "svp", "evp", "general manager"
];

const SOURCE_WEIGHTS: Record<string, number> = {
  referral: 25,
  organic: 15,
  social: 10,
  email: 8,
  partner: 20,
  event: 18,
  paid: 5,
  outbound: 3,
  other: 0,
};

const LIFECYCLE_WEIGHTS: Record<string, number> = {
  customer: 30,
  champion: 35,
  evangelist: 40,
  opportunity: 25,
  qualified: 20,
  lead: 10,
  subscriber: 5,
  other: 0,
};

export interface ScoreBreakdown {
  total: number;
  demographic: number;
  behavioral: number;
  engagement: number;
  source: number;
  lifecycle: number;
  tier: "cold" | "warm" | "hot" | "ready";
}

export async function scoreContact(contactId: string): Promise<ScoreBreakdown> {
  const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, contactId));
  if (!contact) throw new Error("Contact not found");

  let demographic = 0;
  let behavioral = 0;
  let engagement = 0;
  let source = 0;
  let lifecycle = 0;

  // 1. DEMOGRAPHIC (max 25 points)
  if (contact.jobTitle) {
    const lower = contact.jobTitle.toLowerCase();
    const isSenior = SENIORITY_TITLES.some(t => lower.includes(t));
    if (isSenior) demographic += 20;
    else if (lower.includes("manager") || lower.includes("lead")) demographic += 12;
    else demographic += 5;
  }
  if (contact.companyId) demographic += 5; // linked to company
  if (contact.linkedinUrl) demographic += 3;

  // 2. BEHAVIORAL (max 25 points) - email opens/clicks/replies
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 86400;

  const emails = await db.select().from(schema.emails)
    .where(and(eq(schema.emails.contactId, contactId)));

  const recentEmails = emails.filter(e => {
    const ts = e.sentAt ? new Date(e.sentAt).getTime() / 1000 : 0;
    return ts > thirtyDaysAgo;
  });
  
  const opened = recentEmails.filter(e => e.openedAt).length;
  const clicked = recentEmails.filter(e => e.clickedAt).length;
  const replied = recentEmails.filter(e => e.direction === "inbound" && e.sentAt &&
    new Date(e.sentAt).getTime() / 1000 > thirtyDaysAgo).length;

  behavioral += Math.min(opened * 3, 10);
  behavioral += Math.min(clicked * 5, 10);
  behavioral += Math.min(replied * 8, 15);

  // 3. ENGAGEMENT (max 25 points) - activities, meetings
  const activities = await db.select().from(schema.activities)
    .where(and(eq(schema.activities.contactId, contactId)));

  const recentActivities = activities.filter(a => {
    const ts = a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0;
    return ts > thirtyDaysAgo;
  });

  engagement += Math.min(recentActivities.length * 2, 10);

  // Calls/meetings in last 30 days
  const meetings = recentActivities.filter(a =>
    a.type === "call" || a.type === "meeting");
  engagement += Math.min(meetings.length * 5, 15);

  // 4. SOURCE (max 25 points)
  source = SOURCE_WEIGHTS[contact.sourceType || "other"] || 0;

  // 5. LIFECYCLE (max 25 points)
  lifecycle = LIFECYCLE_WEIGHTS[contact.lifecycleStage || "subscriber"] || 0;

  // Penalty: email opt-out
  if (contact.emailOptOut) behavioral = Math.max(0, behavioral - 10);

  const total = Math.min(100, demographic + behavioral + engagement + source + lifecycle);

  const tier: ScoreBreakdown["tier"] =
    total >= 81 ? "ready" :
    total >= 61 ? "hot" :
    total >= 31 ? "warm" : "cold";

  // Persist score
  await db.update(schema.contacts)
    .set({ leadScore: total, updatedAt: new Date() })
    .where(eq(schema.contacts.id, contactId));

  return { total, demographic, behavioral, engagement, source, lifecycle, tier };
}

export async function scoreAllInWorkspace(workspaceId: string): Promise<number> {
  const contacts = await db.select({ id: schema.contacts.id })
    .from(schema.contacts)
    .where(eq(schema.contacts.workspaceId, workspaceId));

  for (const c of contacts) {
    try { await scoreContact(c.id); } catch (e) { /* skip failed */ }
  }

  return contacts.length;
}

export function getTierDescription(tier: string): string {
  switch (tier) {
    case "ready": return "Ready for sales outreach — high engagement, senior title, strong fit";
    case "hot": return "Engaged and qualified — prioritize follow-up";
    case "warm": return "Showing interest — nurture with content";
    case "cold": return "Low engagement — add to drip sequence";
    default: return "Unknown";
  }
}
