import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "@/lib/email";

export async function processSequences(workspaceId: string): Promise<{sent: number; skipped: number; completed: number; paused: number; failed: number}> {
  const now = Date.now();
  const stats = { sent: 0, skipped: 0, completed: 0, paused: 0, failed: 0 };
  const enrollments = await db.select().from(schema.sequenceEnrollments).where(eq(schema.sequenceEnrollments.status, "active"));

  for (const enrollment of enrollments) {
    const curStep = enrollment.currentStep ?? 0;
    try {
      const [sequence] = await db.select().from(schema.sequences).where(and(eq(schema.sequences.id, enrollment.sequenceId), eq(schema.sequences.workspaceId, workspaceId)));
      if (!sequence || sequence.status !== "active") { stats.skipped++; continue; }

      const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, enrollment.contactId));
      if (!contact || contact.emailOptOut) {
        await db.update(schema.sequenceEnrollments).set({ status: "unsubscribed", completedAt: new Date() }).where(eq(schema.sequenceEnrollments.id, enrollment.id));
        stats.paused++; continue;
      }

      const inboxEmails = await db.select().from(schema.emails).where(and(eq(schema.emails.contactId, enrollment.contactId), eq(schema.emails.direction, "inbound")));
      const threeDaysAgo = Math.floor(now / 1000) - 3 * 86400;
      const hasRecentReply = inboxEmails.some((e: any) => { const ts = e.sentAt ? new Date(e.sentAt).getTime() / 1000 : 0; return ts > threeDaysAgo; });
      if (hasRecentReply && curStep > 0) {
        await db.update(schema.sequenceEnrollments).set({ status: "replied", completedAt: new Date() }).where(eq(schema.sequenceEnrollments.id, enrollment.id));
        stats.paused++; continue;
      }

      const steps = await db.select().from(schema.sequenceSteps).where(eq(schema.sequenceSteps.sequenceId, sequence.id));
      const sortedSteps = steps.sort((a: any, b: any) => a.stepNumber - b.stepNumber);
      if (curStep >= sortedSteps.length) {
        await db.update(schema.sequenceEnrollments).set({ status: "completed", completedAt: new Date() }).where(eq(schema.sequenceEnrollments.id, enrollment.id));
        stats.completed++; continue;
      }
      const currentStep = sortedSteps[curStep];
      if (!currentStep) continue;

      const enrolledMs = enrollment.enrolledAt ? new Date(enrollment.enrolledAt).getTime() : 0;
      let requiredDelay = 0;
      for (let i = 0; i <= curStep; i++) requiredDelay += (sortedSteps[i]?.delayDays || 1) * 86400000 + (sortedSteps[i]?.delayHours || 0) * 3600000;
      if ((now - enrolledMs) < requiredDelay) { stats.skipped++; continue; }

      const emailBody = (currentStep.body || "")
        .replace(/\{\{firstName\}\}/g, contact.firstName || "there")
        .replace(/\{\{lastName\}\}/g, contact.lastName || "");
      const htmlBody = `<p>${emailBody.replace(/\n/g, "<br>")}</p>`;
      const fromEmail = process.env.EMAIL_FROM || process.env.FROM_EMAIL || "CRM Hub <crm@yourdomain.com>";

      // Insert email record as pending
      const [emailRecord] = await db.insert(schema.emails).values({
        workspaceId,
        fromEmail,
        fromName: sequence.name,
        toEmail: contact.email || "",
        toName: `${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
        subject: currentStep.subject,
        textBody: emailBody,
        htmlBody,
        contactId: enrollment.contactId,
        sequenceStepId: currentStep.id,
        direction: "outbound",
        provider: "resend",
        deliveryStatus: "pending",
      }).returning();

      // Actually send the email
      const sendResult = await sendEmail({
        to: contact.email || "",
        subject: currentStep.subject,
        html: htmlBody,
        text: emailBody,
        contactId: enrollment.contactId,
        workspaceId,
        from: fromEmail,
      });

      if (sendResult.success && sendResult.id) {
        await db.update(schema.emails)
          .set({
            deliveryStatus: "sent",
            providerMessageId: sendResult.id,
            sentAt: new Date(),
          })
          .where(eq(schema.emails.id, emailRecord.id));
      } else {
        await db.update(schema.emails)
          .set({
            deliveryStatus: "failed",
            error: sendResult.error || "Send failed",
          })
          .where(eq(schema.emails.id, emailRecord.id));
        stats.failed++;
        continue;
      }

      await db.insert(schema.activities).values({
        workspaceId, userId: "system", type: "email", contactId: enrollment.contactId,
        subject: currentStep.subject,
        body: `Auto-sent sequence email: "${currentStep.subject}" (Step ${curStep + 1}/${sortedSteps.length})`,
      });
      await db.update(schema.sequenceEnrollments).set({ currentStep: curStep + 1 }).where(eq(schema.sequenceEnrollments.id, enrollment.id));
      await db.update(schema.sequences).set({ sentCount: (sequence.sentCount || 0) + 1 }).where(eq(schema.sequences.id, sequence.id));
      stats.sent++;
    } catch (e) { console.error("Sequence error:", e); stats.skipped++; }
  }
  return stats;
}

export async function enrollInSequence(sequenceId: string, contactId: string): Promise<{enrolled: boolean; message: string}> {
  const [existing] = await db.select().from(schema.sequenceEnrollments).where(and(eq(schema.sequenceEnrollments.sequenceId, sequenceId), eq(schema.sequenceEnrollments.contactId, contactId)));
  if (existing && existing.status === "active") return { enrolled: false, message: "Already enrolled" };
  if (existing) {
    await db.update(schema.sequenceEnrollments).set({ status: "active", currentStep: 0, enrolledAt: new Date(), completedAt: null }).where(eq(schema.sequenceEnrollments.id, existing.id));
    return { enrolled: true, message: "Re-enrolled" };
  }
  await db.insert(schema.sequenceEnrollments).values({ sequenceId, contactId, status: "active", currentStep: 0, enrolledAt: new Date() });
  return { enrolled: true, message: "Enrolled" };
}
