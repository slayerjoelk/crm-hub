import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { enrollInSequence } from "@/lib/automation/sequence-engine";
import { triggerWebhooks } from "@/lib/automation/webhooks";
import { injectTracking } from "@/lib/email-tracking";

/* ────────────────────────────────────────────
   Workflow Automation Engine  (HubSpot-style)

   A workflow = trigger → conditions (AND) → actions (ordered).

   Triggers fire from app events (runWorkflows) or the cron
   (processScheduledWorkflows for score thresholds + time-based).

   Actions supported:
     create_task, add_tag, remove_tag, enroll_sequence,
     send_email, update_field, set_lifecycle, send_notification,
     trigger_webhook, adjust_score
   ─────────────────────────────────────────── */

export type TriggerType =
  | "contact_created" | "contact_updated" | "deal_created"
  | "deal_stage_changed" | "deal_won" | "deal_lost"
  | "lead_score_threshold" | "tag_added"
  | "email_opened" | "email_clicked" | "email_bounced"
  | "contact_replied" | "task_overdue" | "scheduled";

export interface Condition { field: string; op: string; value?: any; }
export interface Action { type: string; config?: Record<string, any>; }

export interface TriggerContext {
  // Extra signals the caller knows about (new stage id, tag name, score, etc.)
  stageId?: string;
  tagName?: string;
  score?: number;
  previousScore?: number;
  [key: string]: any;
}

// ── Condition evaluation ───────────────────────────────────
function getField(entity: Record<string, any>, field: string): any {
  return entity?.[field];
}

function evalCondition(entity: Record<string, any>, c: Condition): boolean {
  const actual = getField(entity, c.field);
  const expected = c.value;
  switch (c.op) {
    case "eq": return String(actual ?? "") === String(expected ?? "");
    case "neq": return String(actual ?? "") !== String(expected ?? "");
    case "contains": return String(actual ?? "").toLowerCase().includes(String(expected ?? "").toLowerCase());
    case "not_contains": return !String(actual ?? "").toLowerCase().includes(String(expected ?? "").toLowerCase());
    case "gt": return Number(actual) > Number(expected);
    case "gte": return Number(actual) >= Number(expected);
    case "lt": return Number(actual) < Number(expected);
    case "lte": return Number(actual) <= Number(expected);
    case "is_empty": return actual === null || actual === undefined || actual === "";
    case "is_not_empty": return !(actual === null || actual === undefined || actual === "");
    default: return true;
  }
}

function matchesConditions(entity: Record<string, any>, conditions: Condition[]): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => evalCondition(entity, c));
}

// Does the trigger config gate the firing? (e.g. score threshold, specific stage)
function matchesTriggerConfig(triggerType: string, cfg: Record<string, any>, ctx: TriggerContext): boolean {
  if (!cfg) return true;
  switch (triggerType) {
    case "lead_score_threshold": {
      const threshold = Number(cfg.scoreThreshold ?? 0);
      // Fire only when crossing the threshold upward (avoids re-firing every run)
      if (ctx.score === undefined) return false;
      if (ctx.previousScore !== undefined) {
        return ctx.previousScore < threshold && ctx.score >= threshold;
      }
      return ctx.score >= threshold;
    }
    case "deal_stage_changed":
      return !cfg.stageId || cfg.stageId === ctx.stageId;
    case "tag_added":
      return !cfg.tagName || String(cfg.tagName).toLowerCase() === String(ctx.tagName ?? "").toLowerCase();
    default:
      return true;
  }
}

// ── Resolve the contact a workflow acts on ─────────────────
async function resolveContactId(entityType: string, entity: Record<string, any>): Promise<string | null> {
  if (entityType === "contact") return entity.id;
  if (entityType === "deal") return entity.primaryContactId || null;
  return null;
}

// ── Action runner ──────────────────────────────────────────
async function runAction(
  workspaceId: string,
  action: Action,
  entityType: string,
  entity: Record<string, any>,
): Promise<{ type: string; ok: boolean; detail?: string }> {
  const cfg = action.config || {};
  const contactId = await resolveContactId(entityType, entity);

  try {
    switch (action.type) {
      case "create_task": {
        const [anyUser] = await db.select().from(schema.users).where(eq(schema.users.workspaceId, workspaceId));
        const delayDays = Number(cfg.dueInDays ?? 1);
        await db.insert(schema.tasks).values({
          workspaceId,
          userId: entity.ownerId || anyUser?.id || "system",
          title: interpolate(cfg.title || "Follow up", entity),
          description: interpolate(cfg.description || "", entity),
          contactId: entityType === "contact" ? entity.id : (entity.primaryContactId || null),
          dealId: entityType === "deal" ? entity.id : null,
          status: "todo",
          priority: cfg.priority || "medium",
          dueDate: new Date(Date.now() + delayDays * 86400000),
        });
        return { type: action.type, ok: true };
      }

      case "add_tag": {
        if (!contactId && entityType !== "deal") return { type: action.type, ok: false, detail: "no entity" };
        const tagName = cfg.tagName || cfg.value;
        if (!tagName) return { type: action.type, ok: false, detail: "no tag" };
        let [tag] = await db.select().from(schema.tags).where(and(eq(schema.tags.name, tagName), eq(schema.tags.workspaceId, workspaceId)));
        if (!tag) [tag] = await db.insert(schema.tags).values({ workspaceId, name: tagName, color: cfg.color || "#5e6ad2" }).returning();
        const targetType = entityType === "deal" ? "deal" : "contact";
        const targetId = entityType === "deal" ? entity.id : contactId!;
        const existing = await db.select().from(schema.tagRelations).where(and(eq(schema.tagRelations.tagId, tag.id), eq(schema.tagRelations.entityId, targetId)));
        if (existing.length === 0) {
          await db.insert(schema.tagRelations).values({ tagId: tag.id, entityType: targetType, entityId: targetId });
        }
        return { type: action.type, ok: true };
      }

      case "enroll_sequence": {
        if (!contactId) return { type: action.type, ok: false, detail: "no contact" };
        if (!cfg.sequenceId) return { type: action.type, ok: false, detail: "no sequence" };
        const r = await enrollInSequence(cfg.sequenceId, contactId);
        return { type: action.type, ok: r.enrolled, detail: r.message };
      }

      case "send_email": {
        if (!contactId) return { type: action.type, ok: false, detail: "no contact" };
        const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, contactId));
        if (!contact?.email) return { type: action.type, ok: false, detail: "no email" };

        let subject = cfg.subject || "";
        let body = cfg.body || "";
        if (cfg.templateId) {
          const [tpl] = await db.select().from(schema.emailTemplates).where(eq(schema.emailTemplates.id, cfg.templateId));
          if (tpl) { subject = tpl.subject; body = tpl.body; await db.update(schema.emailTemplates).set({ useCount: (tpl.useCount || 0) + 1 }).where(eq(schema.emailTemplates.id, tpl.id)); }
        }
        subject = interpolate(subject, contact);
        const text = interpolate(body, contact);
        const html = `<p>${text.replace(/\n/g, "<br>")}</p>`;
        const from = process.env.EMAIL_FROM || process.env.FROM_EMAIL || "CRM Hub <crm@yourdomain.com>";

        const [rec] = await db.insert(schema.emails).values({
          workspaceId, fromEmail: from, fromName: "Workflow", toEmail: contact.email,
          toName: `${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
          subject, textBody: text, htmlBody: html, contactId, direction: "outbound",
          provider: "resend", deliveryStatus: "pending",
        }).returning();

        const trackedHtml = injectTracking(html, rec.id);
        const res = await sendEmail({ to: contact.email, subject, html: trackedHtml, text, contactId, workspaceId, from });
        await db.update(schema.emails).set(
          res.success ? { deliveryStatus: "sent", providerMessageId: res.id, sentAt: new Date() }
                      : { deliveryStatus: "failed", error: res.error }
        ).where(eq(schema.emails.id, rec.id));
        return { type: action.type, ok: res.success, detail: res.error };
      }

      case "update_field": {
        if (entityType === "contact") {
          await db.update(schema.contacts).set({ [cfg.field]: cfg.value, updatedAt: new Date() }).where(eq(schema.contacts.id, entity.id));
        } else if (entityType === "deal") {
          await db.update(schema.deals).set({ [cfg.field]: cfg.value, updatedAt: new Date() }).where(eq(schema.deals.id, entity.id));
        }
        return { type: action.type, ok: true };
      }

      case "set_lifecycle": {
        if (contactId) await db.update(schema.contacts).set({ lifecycleStage: cfg.stage, updatedAt: new Date() }).where(eq(schema.contacts.id, contactId));
        return { type: action.type, ok: true };
      }

      case "adjust_score": {
        if (contactId) {
          const [c] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, contactId));
          const next = Math.max(0, Math.min(100, (c?.leadScore || 0) + Number(cfg.amount || 0)));
          await db.update(schema.contacts).set({ leadScore: next, updatedAt: new Date() }).where(eq(schema.contacts.id, contactId));
        }
        return { type: action.type, ok: true };
      }

      case "send_notification": {
        const [anyUser] = await db.select().from(schema.users).where(eq(schema.users.workspaceId, workspaceId));
        if (anyUser) {
          await db.insert(schema.notifications).values({
            workspaceId, userId: anyUser.id, type: entityType === "deal" ? "deal" : "contact",
            title: interpolate(cfg.title || "Workflow alert", entity),
            body: interpolate(cfg.body || "", entity),
          });
        }
        return { type: action.type, ok: true };
      }

      case "trigger_webhook": {
        await triggerWebhooks(workspaceId, cfg.event || "workflow.fired", entityType, entity.id, { ...entity });
        return { type: action.type, ok: true };
      }

      default:
        return { type: action.type, ok: false, detail: "unknown action" };
    }
  } catch (e: any) {
    return { type: action.type, ok: false, detail: e?.message || "error" };
  }
}

// ── Merge-tag interpolation ────────────────────────────────
function interpolate(tpl: string, entity: Record<string, any>): string {
  if (!tpl) return "";
  return tpl
    .replace(/\{\{\s*firstName\s*\}\}/gi, entity.firstName || "there")
    .replace(/\{\{\s*lastName\s*\}\}/gi, entity.lastName || "")
    .replace(/\{\{\s*name\s*\}\}/gi, `${entity.firstName || ""} ${entity.lastName || ""}`.trim() || "there")
    .replace(/\{\{\s*email\s*\}\}/gi, entity.email || "")
    .replace(/\{\{\s*company\s*\}\}/gi, entity.company || "")
    .replace(/\{\{\s*dealName\s*\}\}/gi, entity.name || "");
}

// ── Has this entity already been processed by this workflow? ─
async function alreadyEnrolled(workflowId: string, entityId: string): Promise<boolean> {
  const rows = await db.select().from(schema.workflowExecutions)
    .where(and(eq(schema.workflowExecutions.workflowId, workflowId), eq(schema.workflowExecutions.entityId, entityId)));
  return rows.length > 0;
}

/**
 * Fire all active workflows for a trigger against a single entity.
 * Call from app events (contact.created, deal.stage_changed, etc.).
 */
export async function runWorkflows(
  workspaceId: string,
  triggerType: TriggerType,
  entityType: "contact" | "deal",
  entity: Record<string, any>,
  ctx: TriggerContext = {},
): Promise<{ fired: number; actions: number }> {
  let fired = 0, actionsRun = 0;

  const all = await db.select().from(schema.workflows).where(and(
    eq(schema.workflows.workspaceId, workspaceId),
    eq(schema.workflows.status, "active"),
    eq(schema.workflows.triggerType, triggerType),
  ));

  for (const wf of all) {
    try {
      const triggerConfig = safeParse(wf.triggerConfig, {});
      const conditions: Condition[] = safeParse(wf.conditions, []);
      const actions: Action[] = safeParse(wf.actions, []);

      if (!matchesTriggerConfig(triggerType, triggerConfig, ctx)) continue;
      if (!matchesConditions(entity, conditions)) continue;
      if (!wf.allowReenrollment && await alreadyEnrolled(wf.id, entity.id)) continue;

      const results: Array<{ type: string; ok: boolean; detail?: string }> = [];
      for (const action of actions) {
        results.push(await runAction(workspaceId, action, entityType, entity));
      }
      actionsRun += results.length;
      fired++;

      const okCount = results.filter((r) => r.ok).length;
      const status = okCount === results.length ? "success" : okCount === 0 ? "failed" : "partial";

      await db.insert(schema.workflowExecutions).values({
        workflowId: wf.id, workspaceId, entityType, entityId: entity.id,
        status, actionsRun: JSON.stringify(results),
      });
      await db.update(schema.workflows).set({
        enrolledCount: (wf.enrolledCount || 0) + 1,
        completedCount: (wf.completedCount || 0) + (status !== "failed" ? 1 : 0),
        lastRunAt: new Date(),
      }).where(eq(schema.workflows.id, wf.id));
    } catch (e: any) {
      await db.insert(schema.workflowExecutions).values({
        workflowId: wf.id, workspaceId, entityType, entityId: entity.id,
        status: "failed", error: e?.message || "engine error",
      }).catch(() => {});
    }
  }

  return { fired, actions: actionsRun };
}

/**
 * Cron entry: evaluate score-threshold + scheduled workflows across all contacts.
 * Score-threshold workflows fire when a contact is at/above the threshold and
 * hasn't been enrolled yet (re-enrollment respected).
 */
export async function processScheduledWorkflows(workspaceId: string): Promise<{ fired: number; actions: number }> {
  let fired = 0, actions = 0;

  const wfs = await db.select().from(schema.workflows).where(and(
    eq(schema.workflows.workspaceId, workspaceId),
    eq(schema.workflows.status, "active"),
  ));
  const scoreWfs = wfs.filter((w) => w.triggerType === "lead_score_threshold");
  const schedWfs = wfs.filter((w) => w.triggerType === "scheduled");

  if (scoreWfs.length || schedWfs.length) {
    const contacts = await db.select().from(schema.contacts).where(eq(schema.contacts.workspaceId, workspaceId));
    for (const contact of contacts) {
      for (const wf of scoreWfs) {
        const cfg = safeParse<Record<string, any>>(wf.triggerConfig, {});
        const threshold = Number(cfg.scoreThreshold ?? 0);
        if ((contact.leadScore || 0) >= threshold) {
          const r = await runWorkflows(workspaceId, "lead_score_threshold", "contact", contact, { score: contact.leadScore || 0 });
          fired += r.fired; actions += r.actions;
        }
      }
      for (const wf of schedWfs) {
        const conditions: Condition[] = safeParse(wf.conditions, []);
        if (matchesConditions(contact, conditions)) {
          const r = await runWorkflows(workspaceId, "scheduled", "contact", contact, {});
          fired += r.fired; actions += r.actions;
        }
      }
    }
  }

  return { fired, actions };
}

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
