/**
 * ClarAccord → CRM Integration
 * 
 * Drop this script into ClarAccord's signup flow.
 * When a user registers via magic-link on ClarAccord,
 * their details get captured into the CRM automatically.
 * 
 * Usage in ClarAccord register/page.tsx:
 * 
 *   import { syncToCRM } from "@/lib/crm-integration";
 *   
 *   // After successful magic-link auth:
 *   await syncToCRM(email, { name, company, plan: "free" });
 */

const CRM_CAPTURE_URL = process.env.CRM_CAPTURE_URL || "https://crm-hub.vercel.app/api/capture";
const CRM_WORKSPACE = process.env.CRM_WORKSPACE || "mintagree";
const CRM_API_KEY = process.env.CRM_API_KEY || "";

export interface CRMLeadData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  name?: string; // full name, will be split
  company?: string;
  plan?: string;
  sourceType?: string;
  sourceDetail?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export async function syncToCRM(
  email: string,
  data: Omit<CRMLeadData, "email"> = {}
): Promise<{ synced: boolean; contactId?: string; error?: string }> {
  if (!CRM_CAPTURE_URL || !CRM_WORKSPACE) {
    console.warn("[CRM] Not configured. Set CRM_CAPTURE_URL and CRM_WORKSPACE env vars.");
    return { synced: false, error: "CRM not configured" };
  }

  try {
    // Split full name into first/last if provided
    const firstName = data.firstName || data.name?.split(" ")[0] || "";
    const lastName = data.lastName || data.name?.split(" ").slice(1).join(" ") || "";

    const payload = {
      email: email.toLowerCase().trim(),
      firstName,
      lastName,
      phone: data.phone || undefined,
      company: data.company || undefined,
      sourceType: data.sourceType || "organic",
      sourceDetail: data.sourceDetail || "ClarAccord signup",
      tags: [
        "claraccord_user",
        data.plan || "free",
        ...(data.tags || []),
      ],
      metadata: {
        source: "claraccord",
        plan: data.plan || "free",
        signupDate: new Date().toISOString(),
        ...(data.metadata || {}),
      },
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-workspace-slug": CRM_WORKSPACE,
    };

    if (CRM_API_KEY) {
      headers["x-api-key"] = CRM_API_KEY;
    }

    const res = await fetch(CRM_CAPTURE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("[CRM] Capture failed:", json);
      return { synced: false, error: json.error || "Capture failed" };
    }

    return {
      synced: true,
      contactId: json.data?.id,
    };
  } catch (e: any) {
    console.error("[CRM] Sync error:", e.message);
    return { synced: false, error: e.message };
  }
}

/**
 * Track page visits / events into CRM analytics
 */
export async function trackCRM(
  event: string,
  userId: string,
  properties: Record<string, any> = {}
): Promise<boolean> {
  try {
    const analyticsUrl = `${CRM_CAPTURE_URL}/analytics`;
    const res = await fetch(analyticsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-workspace-slug": CRM_WORKSPACE,
        ...(CRM_API_KEY ? { "x-api-key": CRM_API_KEY } : {}),
      },
      body: JSON.stringify({
        event,
        userId,
        properties,
        timestamp: new Date().toISOString(),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
