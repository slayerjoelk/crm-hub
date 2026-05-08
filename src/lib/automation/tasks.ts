import { db, schema } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";

export async function autoCreateTasks(workspaceId: string): Promise<{
  created: number; escalated: number;
}> {
  const stats = { created: 0, escalated: 0 };
  const dayMs = 86400;

  const [anyUser] = await db.select()
    .from(schema.users)
    .where(eq(schema.users.workspaceId, workspaceId));
  const sysUser = anyUser?.id || "";

  // 1. STALE CONTACT RE-ENGAGEMENT
  const fourteenDaysAgo = new Date(Date.now() - 14 * dayMs * 1000);
  const staleContacts = await db.select()
    .from(schema.contacts)
    .where(and(
      eq(schema.contacts.workspaceId, workspaceId),
      sql`${schema.contacts.lifecycleStage} NOT IN ('customer', 'champion', 'evangelist')`,
    ));

  for (const contact of staleContacts) {
    const lastActivity = contact.lastActivityAt
      ? new Date(contact.lastActivityAt as any).getTime()
      : (contact.createdAt ? new Date(contact.createdAt as any).getTime() : Date.now());

    if (lastActivity < fourteenDaysAgo.getTime()) {
      const existing = await db.select()
        .from(schema.tasks)
        .where(and(
          eq(schema.tasks.contactId, contact.id),
          eq(schema.tasks.status, "todo"),
          sql`${schema.tasks.title} LIKE '%Re-engage%'`
        ));

      if (existing.length === 0) {
        await db.insert(schema.tasks).values({
          workspaceId,
          userId: contact.ownerId || sysUser,
          title: `Re-engage: ${contact.firstName || ""} ${contact.lastName || ""}`,
          description: `Stale contact - last activity was ${new Date(lastActivity).toLocaleDateString()}. Schedule follow-up.`,
          contactId: contact.id,
          status: "todo",
          priority: "medium",
          dueDate: new Date(Date.now() + 2 * dayMs * 1000),
        });
        stats.created++;
      }
    }
  }

  // 2. OVERDUE TASK ESCALATION
  const overdue = await db.select()
    .from(schema.tasks)
    .where(and(
      eq(schema.tasks.workspaceId, workspaceId),
      eq(schema.tasks.status, "todo"),
      sql`${schema.tasks.dueDate} IS NOT NULL`,
      sql`${schema.tasks.dueDate} < ${Math.floor(Date.now() / 1000)}`
    ));

  for (const task of overdue) {
    await db.update(schema.tasks)
      .set({ priority: "high", status: "in_progress" })
      .where(eq(schema.tasks.id, task.id));

    if (sysUser) {
      await db.insert(schema.activities).values({
        workspaceId,
        userId: sysUser,
        type: "task",
        contactId: task.contactId,
        body: `Task "${task.title}" overdue - escalated to high priority`,
      });
    }
    stats.escalated++;
  }

  // 3. NEW CONTACT -> WELCOME TASK
  const oneDayAgo = new Date(Date.now() - dayMs * 1000);
  const newContacts = await db.select()
    .from(schema.contacts)
    .where(and(
      eq(schema.contacts.workspaceId, workspaceId),
      sql`${schema.contacts.createdAt} > ${Math.floor(oneDayAgo.getTime() / 1000)}`
    ));

  for (const contact of newContacts) {
    const score = contact.leadScore ?? 0;
    if (score > 60) {
      const existing = await db.select()
        .from(schema.tasks)
        .where(and(
          eq(schema.tasks.contactId, contact.id),
          sql`${schema.tasks.title} LIKE 'Welcome%'`
        ));

      if (existing.length === 0) {
        await db.insert(schema.tasks).values({
          workspaceId,
          userId: contact.ownerId || sysUser,
          title: `Welcome: ${contact.firstName || ""} ${contact.lastName || ""} (Score: ${score})`,
          description: "High-scoring new contact. Send personalized welcome + schedule intro call.",
          contactId: contact.id,
          status: "todo",
          priority: score > 80 ? "high" : "medium",
          dueDate: new Date(Date.now() + dayMs * 1000),
        });
        stats.created++;
      }
    }
  }

  return stats;
}
