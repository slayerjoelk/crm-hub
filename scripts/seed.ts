import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import * as schema from "../lib/db/schema";
import { hashPassword } from "../lib/auth";

async function seed() {
  console.log("CRM-HUB: Seeding demo data...");
  console.log("CRM-HUB: Seeding demo data...");

  // ── Workspace: MintAgree ──
  const mintagree = await db.insert(schema.workspaces).values({
    slug: "mintagree",
    name: "MintAgree",
    description: "Conversation receipts & client sign-off for agencies",
    domain: "mintagree.com",
    plan: "starter",
    primaryColor: "#10b981",
    accentColor: "#0d9488",
    status: "active",
  }).returning();

  const wsMintagree = mintagree[0];

  // Owner user
  const owner = await db.insert(schema.users).values({
    workspaceId: wsMintagree.id,
    email: "joel@mintagree.com",
    name: "Joel",
    role: "owner",
    status: "active",
    passwordHash: await hashPassword("demo123"),
  }).returning();

  // ── Workspace: Second Brain ──
  const secondB = await db.insert(schema.workspaces).values({
    slug: "secondbrain",
    name: "Second Brain Co",
    description: "Knowledge management agency",
    plan: "free",
    primaryColor: "#6366f1",
    accentColor: "#8b5cf6",
    status: "active",
  }).returning();

  const wsSecond = secondB[0];

  const owner2 = await db.insert(schema.users).values({
    workspaceId: wsSecond.id,
    email: "joel@secondbrain.io",
    name: "Joel",
    role: "owner",
    status: "active",
    passwordHash: await hashPassword("demo123"),
  }).returning();

  // ── MintAgree Pipeline ──
  const pipeline = await db.insert(schema.pipelines).values({
    workspaceId: wsMintagree.id,
    name: "Sales Pipeline",
    type: "deal",
    isDefault: true,
    color: "#10b981",
  }).returning();

  const stages = [
    { name: "New Lead", winProbability: 10 },
    { name: "Qualified", winProbability: 25 },
    { name: "Proposal", winProbability: 50 },
    { name: "Negotiation", winProbability: 75 },
    { name: "Closed Won", winProbability: 100 },
    { name: "Closed Lost", winProbability: 0 },
  ];

  let order = 0;
  for (const s of stages) {
    await db.insert(schema.pipelineStages).values({
      pipelineId: pipeline[0].id,
      name: s.name,
      displayOrder: order++,
      winProbability: s.winProbability,
      color: s.name === "Closed Won" ? "#10b981" : s.name === "Closed Lost" ? "#ef4444" : "#64748b",
    });
  }

  // ── MintAgree Companies ──
  const demoCompanies = [
    { name: "Stripe", domain: "stripe.com", industry: "FinTech", size: "1000+", lifecycleStage: "customer" as const },
    { name: "Vercel", domain: "vercel.com", industry: "DevTools", size: "201-500", lifecycleStage: "opportunity" as const },
    { name: "Linear", domain: "linear.app", industry: "DevTools", size: "201-500", lifecycleStage: "qualified" as const },
    { name: "Notion", domain: "notion.so", industry: "Productivity", size: "501-1000", lifecycleStage: "lead" as const },
  ];

  for (const c of demoCompanies) {
    const co = await db.insert(schema.companies).values({
      workspaceId: wsMintagree.id,
      ownerId: owner[0].id,
      ...c,
      sourceType: "outbound",
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 1e10)),
    }).returning();

    // Contacts for each company
    if (c.name === "Stripe") {
      const contact = await db.insert(schema.contacts).values({
        workspaceId: wsMintagree.id,
        ownerId: owner[0].id,
        companyId: co[0].id,
        firstName: "Sarah",
        lastName: "Chen",
        email: "sarah@stripe.com",
        phone: "+1-415-555-0100",
        jobTitle: "VP Engineering",
        leadStatus: "connected",
        lifecycleStage: "customer",
        city: "San Francisco",
        country: "USA",
        lastActivityAt: new Date(),
      }).returning();

      // Deal for Stripe
      const allStages = await db.select().from(schema.pipelineStages).where(eq(schema.pipelineStages.pipelineId, pipeline[0].id));
      const wonStage = allStages.find(s => s.name === "Closed Won");
      if (wonStage) {
        await db.insert(schema.deals).values({
          workspaceId: wsMintagree.id,
          ownerId: owner[0].id,
          companyId: co[0].id,
          primaryContactId: contact[0].id,
          pipelineId: pipeline[0].id,
          stageId: wonStage.id,
          name: "Enterprise Plan — Stripe",
          value: 49900,
          currency: "USD",
          priority: "high",
          status: "won",
          actualCloseDate: new Date(Date.now() - 86400000 * 30),
          expectedCloseDate: new Date(Date.now() - 86400000 * 30),
          closeReason: "Signed annual contract",
        });
      }

      await db.insert(schema.activities).values({
        workspaceId: wsMintagree.id,
        userId: owner[0].id,
        contactId: contact[0].id,
        type: "deal_won",
        body: "Enterprise contract signed with Sarah Chen at Stripe",
        subject: "Enterprise Plan — Stripe won",
      });
    }
  }

  // ── Tags ──
  const demoTags = [
    { name: "Hot Lead", color: "#ef4444" },
    { name: "Enterprise", color: "#f59e0b" },
    { name: "Partner", color: "#10b981" },
    { name: "Needs Follow-up", color: "#3b82f6" },
  ];
  for (const t of demoTags) {
    await db.insert(schema.tags).values({ workspaceId: wsMintagree.id, ...t });
  }

  // ── Tasks ──
  await db.insert(schema.tasks).values({
    workspaceId: wsMintagree.id,
    userId: owner[0].id,
    title: "Follow up with Vercel sales team",
    description: "Send ROI calculator and scheduling link",
    status: "todo",
    priority: "high",
    dueDate: new Date(Date.now() + 86400000),
  });

  console.log("✅ CRM-HUB seeded successfully");
  console.log(`  Workspaces: 2`);
  console.log(`  Users: 2`);
  console.log(`  Companies: ${demoCompanies.length}`);
  console.log(`  Tags: ${demoTags.length}`);
  console.log(`  Login: joel@mintagree.com / demo123 `);
  console.log(`  Login: joel@secondbrain.io / demo123 `);
}

import { eq } from "drizzle-orm";

seed().catch(console.error);
