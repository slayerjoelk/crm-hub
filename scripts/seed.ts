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

  // Create stages
  const stages = await db
    .insert(schema.pipelineStages)
    .values([
      { workspaceId: workspace.id, pipelineId: pipeline.id, name: "Lead", displayOrder: 1 },
      { workspaceId: workspace.id, pipelineId: pipeline.id, name: "Qualified", displayOrder: 2 },
      { workspaceId: workspace.id, pipelineId: pipeline.id, name: "Proposal", displayOrder: 3 },
      { workspaceId: workspace.id, pipelineId: pipeline.id, name: "Won", displayOrder: 4 },
      { workspaceId: workspace.id, pipelineId: pipeline.id, name: "Lost", displayOrder: 5 },
    ])
    .returning();

  // Create contacts
  const contacts = await db
    .insert(schema.contacts)
    .values([
      { workspaceId: workspace.id, name: "John Smith", email: "john@acme.com", status: "active" },
      { workspaceId: workspace.id, name: "Jane Doe", email: "jane@techcorp.com", status: "active" },
      { workspaceId: workspace.id, name: "Bob Johnson", email: "bob@startup.io", status: "lead" },
    ])
    .returning();

  // Create companies
  const companies = await db
    .insert(schema.companies)
    .values([
      { workspaceId: workspace.id, name: "Acme Corp", domain: "acme.com", status: "active" },
      { workspaceId: workspace.id, name: "TechCorp", domain: "techcorp.com", status: "active" },
    ])
    .returning();

  // Create deals
  await db.insert(schema.deals).values([
    {
      workspaceId: workspace.id,
      pipelineId: pipeline.id,
      stageId: stages[0].id,
      name: "Enterprise Deal",
      value: "50000",
      currency: "USD",
      priority: "high",
      status: "open",
    },
    {
      workspaceId: workspace.id,
      pipelineId: pipeline.id,
      stageId: stages[1].id,
      name: "SMB Deal",
      value: "12000",
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
