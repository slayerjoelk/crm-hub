import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { withWorkspace } from "@/lib/middleware";
import { eq } from "drizzle-orm";

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let val = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes; continue;
    }
    if (ch === ',' && !inQuotes) { current.push(val.trim()); val = ""; continue; }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      current.push(val.trim()); if (current.length > 1 || current[0]) rows.push(current); current = []; val = ""; continue;
    }
    val += ch;
  }
  if (val.trim() || current.length) { current.push(val.trim()); rows.push(current); }
  return rows;
}

function normalizeHeaders(headers: string[]): string[] {
  return headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
}

import { withRateLimit } from "@/lib/rate-limit";

export const POST = withRateLimit(async function importHandler(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const type = (await params).type;
  return withWorkspace(req, async ({ workspaceId }) => {
    const body = await req.json();
    const text = body.csv;
    if (!text) return NextResponse.json({ error: "No CSV provided" }, { status: 400 });
    const rows = parseCSV(text);
    if (rows.length < 2) return NextResponse.json({ error: "CSV must have header + data rows" }, { status: 400 });
    const rawHeaders = rows[0];
    const headers = normalizeHeaders(rawHeaders);
    const data = rows.slice(1);
    const results: any[] = [];
    const errors: string[] = [];

    // Deals require a pipeline + stage (NOT NULL). Resolve a default once up front.
    let dealPipeline: any = null;
    let dealStages: any[] = [];
    if (type === "deals") {
      const pls = await db.select().from(schema.pipelines).where(eq(schema.pipelines.workspaceId, workspaceId));
      dealPipeline = pls.find((p: any) => p.isDefault) || pls[0];
      if (!dealPipeline) {
        return NextResponse.json({ error: "Create a pipeline before importing deals" }, { status: 400 });
      }
      dealStages = await db.select().from(schema.pipelineStages).where(eq(schema.pipelineStages.pipelineId, dealPipeline.id));
    }

    for (const row of data) {
      if (row.length < headers.length && row.every(c => !c)) continue;
      const obj: any = { workspaceId };
      for (let i = 0; i < headers.length; i++) {
        const key = headers[i];
        const val = row[i]?.trim() ?? "";
        if (!val) continue;
        if (type === "contacts") {
          if (key.includes("firstname") || key === "firstn" || key === "fname") obj.firstName = val;
          else if (key.includes("lastname") || key === "lastn" || key === "lname") obj.lastName = val;
          else if (key.includes("email")) obj.email = val;
          else if (key.includes("phone")) obj.phone = val;
          else if (key.includes("company")) obj.company = val;
          else if (key.includes("title") || key.includes("job")) obj.jobTitle = val;
          else if (key.includes("stage")) obj.lifecycleStage = val;
          else if (key.includes("status")) obj.leadStatus = val;
          else if (key.includes("source")) obj.sourceType = val;
        } else if (type === "companies") {
          if (key.includes("name")) obj.name = val;
          else if (key.includes("domain")) obj.domain = val;
          else if (key.includes("industry")) obj.industry = val;
          else if (key.includes("size") || key.includes("employees")) obj.employeeCount = parseInt(val) || undefined;
          else if (key.includes("revenue")) obj.annualRevenue = parseFloat(val.replace(/[^0-9.]/g, "")) || undefined;
          else if (key.includes("website")) obj.website = val;
        } else if (type === "deals") {
          if (key.includes("name")) obj.name = val;
          else if (key.includes("amount") || key.includes("value")) obj.value = parseFloat(val.replace(/[^0-9.]/g, "")) || 0;
          else if (key.includes("currency")) obj.currency = val;
          else if (key.includes("stage")) obj._stageName = val; // resolved to stageId below
          else if (key.includes("contact")) obj.primaryContactId = val;
          else if (key.includes("date")) obj.expectedCloseDate = val ? new Date(val) : undefined;
        } else if (type === "tasks") {
          if (key.includes("title")) obj.title = val;
          else if (key.includes("description")) obj.description = val;
          else if (key.includes("status")) obj.status = val;
          else if (key.includes("priority")) obj.priority = val;
          else if (key.includes("due")) obj.dueDate = val ? new Date(val) : undefined;
          else if (key.includes("contact")) obj.contactId = val;
        }
      }
      if (Object.keys(obj).length <= 1) continue;

      // Deals: map the CSV stage name → a real stageId and set the required pipelineId
      if (type === "deals") {
        if (!obj.name) { errors.push("Deal row skipped: missing name"); continue; }
        const wanted = String(obj._stageName || "").toLowerCase();
        const stage = dealStages.find((s: any) => (s.name || "").toLowerCase() === wanted)
          || dealStages.sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))[0];
        delete obj._stageName;
        if (!stage) { errors.push(`Deal "${obj.name}": pipeline has no stages`); continue; }
        obj.pipelineId = dealPipeline.id;
        obj.stageId = stage.id;
        obj.status = obj.status || "open";
      }

      try {
        let table: any = null;
        if (type === "contacts") table = schema.contacts;
        else if (type === "companies") table = schema.companies;
        else if (type === "deals") table = schema.deals;
        else if (type === "tasks") table = schema.tasks;
        else { errors.push("Unknown import type"); break; }

        // Deduplication: skip if email already exists for contacts
        if (type === "contacts" && obj.email) {
          const existing = await db.select().from(schema.contacts).where(eq(schema.contacts.workspaceId, workspaceId));
          if (existing.some(e => e.email?.toLowerCase() === obj.email.toLowerCase())) {
            errors.push(`Skipped duplicate email: ${obj.email}`); continue;
          }
        }

        const inserted = await db.insert(table).values(obj).returning() as any[];
        let item = inserted[0];
        if (!item) item = obj; // fallback
        results.push(item);
      } catch (e: any) {
        errors.push(e.message || "Insert failed");
      }
    }
    return NextResponse.json({ imported: results.length, errors: errors.length > 0 ? errors : undefined, data: results.slice(0, 5) });
  });
});
