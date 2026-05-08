import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

/* ────────────────────────────────────────────
   Webhook Engine
   
   Dispatches webhooks to external systems
   when CRM events fire.
   
   Events:
   - contact.created
   - contact.updated
   - deal.stage_changed
   - deal.won / deal.lost
   - email.opened / email.clicked
   - meeting.scheduled
   ─────────────────────────────────────────── */

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 10000;

export interface WebhookPayload {
  event: string;
  workspaceId: string;
  entityType: string;
  entityId: string;
  data: Record<string, any>;
  timestamp: string;
  version: string;
}

export async function triggerWebhooks(
  workspaceId: string,
  event: string,
  entityType: string,
  entityId: string,
  data: Record<string, any> = {}
): Promise<{ succeeded: number; failed: number }> {
  const payload: WebhookPayload = {
    event,
    workspaceId,
    entityType,
    entityId,
    data,
    timestamp: new Date().toISOString(),
    version: "1.0",
  };

  // Get active webhooks for this workspace matching the event
  const webhooks = await db.select()
    .from(schema.webhooks)
    .where(eq(schema.webhooks.workspaceId, workspaceId));

  const activeWebhooks = webhooks.filter(w => {
    if (!w.isActive) return false;
    try {
      const events: string[] = JSON.parse(w.events || "[]");
      return events.includes(event) || events.includes("*");
    } catch { return false; }
  });

  let succeeded = 0;
  let failed = 0;

  for (const webhook of activeWebhooks) {
    let retries = 0;
    let success = false;

    while (retries < MAX_RETRIES && !success) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-CRM-Event": event,
          "X-CRM-Entity": entityType,
          "X-CRM-Version": "1.0",
        };

        // Add signature if secret is configured
        if (webhook.secret) {
          const sig = await createHmacSignature(
            JSON.stringify(payload),
            webhook.secret,
          );
          headers["X-CRM-Signature"] = sig;
        }

        const res = await fetch(webhook.url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          success = true;
          succeeded++;
        } else {
          retries++;
        }
      } catch (e) {
        retries++;
      }

      if (!success && retries > 0) {
        await new Promise(r => setTimeout(r, 1000 * retries)); // exponential backoff
      }
    }

    // Update webhook status
    await db.update(schema.webhooks)
      .set({
        lastTriggeredAt: new Date(),
        lastStatus: success ? "success" : "failed",
        failureCount: success ? 0 : (webhook.failureCount || 0) + 1,
      })
      .where(eq(schema.webhooks.id, webhook.id));

    if (!success) failed++;
  }

  return { succeeded, failed };
}

async function createHmacSignature(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Buffer.from(new Uint8Array(sig)).toString("hex");
}
