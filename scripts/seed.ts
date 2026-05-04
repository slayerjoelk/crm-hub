// Seed script for CRM Hub production database
// Run: npx tsx src/lib/db/seed.ts

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import bcryptjs from "bcryptjs";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client, { schema });

async function seed() {
  console.log("Seeding CRM Hub production database...");

  // Create default workspace
  const workspaceId = "cwk_default_workspace_1234";
  const userId = "cuser_admin_default_1234";

  await db.insert(schema.workspaces).values({
    id: workspaceId,
    slug: "default",
    name: "Default Workspace",
    description: "Your default CRM workspace",
    plan: "free",
    status: "active",
  });
  console.log("Created workspace: default");

  // Create owner user
  const passwordHash = await bcryptjs.hash("admin123", 10);
  await db.insert(schema.users).values({
    id: userId,
    workspaceId,
    email: "admin@default.com",
    name: "Admin User",
    role: "owner",
    status: "active",
    timezone: "UTC",
    passwordHash,
  });
  console.log("Created owner user: admin@default.com / admin123");

  // Create default pipeline
  const pipelineId = "cpipe_sales_default_1234";
  await db.insert(schema.pipelines).values({
    id: pipelineId,
    workspaceId,
    name: "Sales Pipeline",
    description: "Default sales pipeline",
    isDefault: true,
  });

  // Create default stages
  const stages = [
    { id: "cstg_lead_default_1234", name: "Lead", order: 0, color: "#64748b" },
    { id: "cstg_qualified_d_1234", name: "Qualified", order: 1, color: "#3b82f6" },
    { id: "cstg_proposal_d_1234", name: "Proposal", order: 2, color: "#f59e0b" },
    { id: "cstg_negotiatio_1234", name: "Negotiation", order: 3, color: "#8b5cf6" },
    { id: "cstg_won_default_1234", name: "Closed Won", order: 4, color: "#10b981" },
    { id: "cstg_lost_defaul_1234", name: "Closed Lost", order: 5, color: "#ef4444" },
  ];

  for (const s of stages) {
    await db.insert(schema.pipelineStages).values({
      pipelineId,
      name: s.name,
      displayOrder: s.order,
      color: s.color,
    });
  }
  console.log("Created pipeline with", stages.length, "stages");

  // Create sample tags
  const tagData = [
    { id: "ctag_vip_default_1234", name: "VIP", color: "#10b981" },
    { id: "ctag_hotlead_def_1234", name: "Hot Lead", color: "#ef4444" },
    { id: "ctag_followup_d_1234", name: "Follow Up", color: "#3b82f6" },
    { id: "ctag_cold_default_1234", name: "Cold", color: "#64748b" },
    { id: "ctag_partner_def_1234", name: "Partner", color: "#8b5cf6" },
  ];
  for (const t of tagData) {
    await db.insert(schema.tags).values({
      id: t.id,
      workspaceId,
      name: t.name,
      color: t.color,
    });
  }
  console.log("Created", tagData.length, "tags");

  // Create sample contacts
  const contacts = [
    { firstName: "Alice", lastName: "Smith", email: "alice@techcorp.com", jobTitle: "CTO", leadScore: 85, lifecycleStage: "qualified" as const },
    { firstName: "Bob", lastName: "Johnson", email: "bob@startup.io", jobTitle: "Founder", leadScore: 92, lifecycleStage: "opportunity" as const },
    { firstName: "Carol", lastName: "Williams", email: "carol@enterprise.com", jobTitle: "VP Sales", leadScore: 70, lifecycleStage: "lead" as const },
    { firstName: "David", lastName: "Brown", email: "david@small.co", jobTitle: "Owner", leadScore: 45, lifecycleStage: "subscriber" as const },
  ];
  for (const c of contacts) {
    await db.insert(schema.contacts).values({
      id: randId(),
      workspaceId,
      ownerId: userId,
      ...c,
    });
  }
  console.log("Created", contacts.length, "sample contacts");

  // Create sample company
  const companyId = "ccomp_techcorp_def_1234";
  await db.insert(schema.companies).values({
    id: companyId,
    workspaceId,
    ownerId: userId,
    name: "TechCorp Inc",
    domain: "techcorp.com",
    industry: "Technology",
    size: "201-500",
    lifecycleStage: "customer",
  });
  console.log("Created sample company");

  // Create sample deal
  await db.insert(schema.deals).values({
    id: randId(),
    workspaceId,
    ownerId: userId,
    name: "Enterprise SaaS License",
    value: 25000,
    currency: "USD",
    pipelineId,
    stageId: stages[2].id, // Proposal
    priority: "high",
    probability: 60,
    status: "open",
    companyId,
  });
  console.log("Created sample deal");

  // Create sample tasks
  const tasks = [
    { title: "Follow up with Alice", status: "todo" as const, priority: "high" as const },
    { title: "Send proposal to Bob", status: "in_progress" as const, priority: "critical" as const },
    { title: "Research TechCorp competitors", status: "todo" as const, priority: "medium" as const },
  ];
  for (const t of tasks) {
    await db.insert(schema.tasks).values({
      id: randId(),
      workspaceId,
      userId,
      ...t,
    });
  }
  console.log("Created", tasks.length, "sample tasks");

  // Create sample activities
  const activities = [
    { type: "contact_created" as const, body: "Contact Alice Smith was created", contactId: null },
    { type: "email" as const, body: "Sent welcome email to Bob Johnson", contactId: null },
    { type: "deal_stage_change" as const, body: "Deal \"Enterprise SaaS\" moved to Proposal", dealId: null },
    { type: "note" as const, body: "Called Carol, she's interested in a demo next week", contactId: null },
  ];
  for (const a of activities) {
    await db.insert(schema.activities).values({
      id: randId(),
      workspaceId,
      userId,
      ...a,
    });
  }
  console.log("Created", activities.length, "sample activities");

  console.log("\n=== SEED COMPLETE ===");
  console.log("Login: admin@default.com / admin123");
  console.log("Workspace: /default/dashboard");
  process.exit(0);
}

function randId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "c";
  for (let i = 0; i < 24; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
