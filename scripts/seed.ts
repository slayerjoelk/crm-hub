import { db, schema } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function seed() {
  // Create demo workspace
  const [workspace] = await db
    .insert(schema.workspaces)
    .values({
      slug: "demo",
      name: "Demo Workspace",
      plan: "free",
      status: "active",
    })
    .returning();

  // Create demo user
  const passwordHash = await hashPassword("demo123");
  const [user] = await db
    .insert(schema.users)
    .values({
      workspaceId: workspace.id,
      email: "demo@example.com",
      name: "Demo User",
      passwordHash,
      role: "owner",
      status: "active",
    })
    .returning();

  // Create pipeline
  const [pipeline] = await db
    .insert(schema.pipelines)
    .values({
      workspaceId: workspace.id,
      name: "Sales Pipeline",
      displayOrder: 1,
    })
    .returning();

  // Create stages one-by-one (drizzle values() takes single object)
  const stageNames = ["Lead", "Qualified", "Proposal", "Won", "Lost"];
  const stages: typeof schema.pipelineStages.$inferSelect[] = [];
  for (let i = 0; i < stageNames.length; i++) {
    const [s] = await db.insert(schema.pipelineStages).values({
      pipelineId: pipeline.id,
      name: stageNames[i],
      displayOrder: i,
    }).returning();
    stages.push(s);
  }

  // Create contacts
  const contacts = await db
    .insert(schema.contacts)
    .values([
      { workspaceId: workspace.id, firstName: "John", lastName: "Smith", email: "john@acme.com", lifecycleStage: "customer", leadStatus: "connected" },
      { workspaceId: workspace.id, firstName: "Jane", lastName: "Doe", email: "jane@techcorp.com", lifecycleStage: "customer", leadStatus: "connected" },
      { workspaceId: workspace.id, firstName: "Bob", lastName: "Johnson", email: "bob@startup.io", lifecycleStage: "lead", leadStatus: "new" },
    ])
    .returning();

  // Create companies
  const companies = await db
    .insert(schema.companies)
    .values([
      { workspaceId: workspace.id, name: "Acme Corp", domain: "acme.com", lifecycleStage: "customer" },
      { workspaceId: workspace.id, name: "TechCorp", domain: "techcorp.com", lifecycleStage: "customer" },
    ])
    .returning();

  // Create deals
  await db.insert(schema.deals).values([
    {
      workspaceId: workspace.id,
      pipelineId: pipeline.id,
      stageId: stages[0].id,
      name: "Enterprise Deal",
      value: 50000,
      currency: "USD",
      priority: "high",
      status: "open",
    },
    {
      workspaceId: workspace.id,
      pipelineId: pipeline.id,
      stageId: stages[1].id,
      name: "SMB Deal",
      value: 12000,
      currency: "USD",
      priority: "medium",
      status: "open",
    },
  ]);

  // Create tasks
  await db.insert(schema.tasks).values([
    { workspaceId: workspace.id, userId: user.id, title: "Follow up with John", status: "todo", priority: "high" },
    { workspaceId: workspace.id, userId: user.id, title: "Send proposal to Acme", status: "in_progress", priority: "medium" },
    { workspaceId: workspace.id, userId: user.id, title: "Call Jane", status: "todo", priority: "low" },
  ]);

  console.log("Seeded:", { workspace: workspace.id, user: user.id, pipeline: pipeline.id, contacts: contacts.length, companies: companies.length });
}

seed().catch(console.error);
