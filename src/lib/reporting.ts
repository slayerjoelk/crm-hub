import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

/* ────────────────────────────────────────────
   Reporting engine — flexible group-by aggregation
   over CRM objects, plus a weighted pipeline forecast.
   ─────────────────────────────────────────── */

export type ReportObject = "deals" | "leads" | "contacts" | "companies" | "cases" | "campaigns";

export interface ReportConfig {
  object: ReportObject;
  metric: "count" | "sum";
  measure?: string;     // field to sum (e.g. deals.value)
  groupBy: string;      // field, or "month" for createdAt month
}

const TABLES: Record<ReportObject, any> = {
  deals: schema.deals, leads: schema.leads, contacts: schema.contacts,
  companies: schema.companies, cases: schema.cases, campaigns: schema.campaigns,
};

// Which group-by + measure options each object exposes (drives the UI)
export const REPORT_SCHEMA: Record<ReportObject, { groupBy: string[]; measures: string[] }> = {
  deals: { groupBy: ["status", "stageId", "priority", "sourceType", "month"], measures: ["value"] },
  leads: { groupBy: ["status", "rating", "source", "industry", "month"], measures: [] },
  contacts: { groupBy: ["lifecycleStage", "leadStatus", "sourceType", "month"], measures: ["leadScore"] },
  companies: { groupBy: ["type", "industry", "lifecycleStage", "month"], measures: ["annualRevenue", "employeeCount"] },
  cases: { groupBy: ["status", "priority", "type", "origin", "month"], measures: [] },
  campaigns: { groupBy: ["status", "type"], measures: ["actualCost", "expectedRevenue"] },
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthLabel(d: any): string {
  if (!d) return "Unknown";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return "Unknown";
  return `${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

export async function runReport(workspaceId: string, cfg: ReportConfig): Promise<{ rows: { label: string; value: number }[]; total: number }> {
  const table = TABLES[cfg.object];
  if (!table) return { rows: [], total: 0 };
  const data = await db.select().from(table).where(eq(table.workspaceId, workspaceId));

  const groups = new Map<string, number>();
  for (const r of data as any[]) {
    const key = cfg.groupBy === "month" ? monthLabel(r.createdAt) : (r[cfg.groupBy] ?? "—");
    const label = String(key === "" ? "—" : key);
    const add = cfg.metric === "sum" && cfg.measure ? Number(r[cfg.measure] || 0) : 1;
    groups.set(label, (groups.get(label) || 0) + add);
  }

  const rows = [...groups.entries()]
    .map(([label, value]) => ({ label: humanize(label), value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);
  const total = rows.reduce((s, r) => s + r.value, 0);
  return { rows, total };
}

function humanize(s: string): string {
  if (!s || s === "—") return s || "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ── Weighted pipeline forecast ─────────────────────────────
export async function runForecast(workspaceId: string) {
  const deals = await db.select().from(schema.deals).where(eq(schema.deals.workspaceId, workspaceId));
  const stages = await db.select().from(schema.pipelineStages);
  const stageProb = new Map(stages.map(s => [s.id, s.winProbability ?? 0]));

  const open = deals.filter(d => d.status === "open");
  const won = deals.filter(d => d.status === "won");

  const openValue = open.reduce((s, d) => s + (d.value || 0), 0);
  const wonValue = won.reduce((s, d) => s + (d.value || 0), 0);

  // Weighted = value × (deal.probability OR stage win-probability)
  const weighted = open.reduce((s, d) => {
    const p = (d.probability && d.probability > 0) ? d.probability : (stageProb.get(d.stageId) || 0);
    return s + (d.value || 0) * (p / 100);
  }, 0);

  // Best case = open deals with prob ≥ 40%
  const bestCase = open.reduce((s, d) => {
    const p = (d.probability && d.probability > 0) ? d.probability : (stageProb.get(d.stageId) || 0);
    return s + (p >= 40 ? (d.value || 0) : 0);
  }, 0);

  // Commit = open deals with prob ≥ 70%
  const commit = open.reduce((s, d) => {
    const p = (d.probability && d.probability > 0) ? d.probability : (stageProb.get(d.stageId) || 0);
    return s + (p >= 70 ? (d.value || 0) : 0);
  }, 0);

  // Forecast by close month (weighted)
  const byMonth = new Map<string, { weighted: number; open: number; won: number }>();
  function bucket(key: string) { if (!byMonth.has(key)) byMonth.set(key, { weighted: 0, open: 0, won: 0 }); return byMonth.get(key)!; }
  for (const d of open) {
    const key = monthLabel(d.expectedCloseDate || d.createdAt);
    const p = (d.probability && d.probability > 0) ? d.probability : (stageProb.get(d.stageId) || 0);
    const b = bucket(key); b.open += d.value || 0; b.weighted += (d.value || 0) * (p / 100);
  }
  for (const d of won) {
    const key = monthLabel(d.actualCloseDate || d.updatedAt || d.createdAt);
    bucket(key).won += d.value || 0;
  }

  // Pipeline by stage
  const byStage = stages.map(st => ({
    label: st.name,
    value: open.filter(d => d.stageId === st.id).reduce((s, d) => s + (d.value || 0), 0),
    count: open.filter(d => d.stageId === st.id).length,
  })).filter(s => s.value > 0);

  const months = [...byMonth.entries()].map(([label, v]) => ({ label, ...v, weighted: Math.round(v.weighted), open: Math.round(v.open), won: Math.round(v.won) }));

  return {
    summary: {
      openValue: Math.round(openValue), weighted: Math.round(weighted),
      bestCase: Math.round(bestCase), commit: Math.round(commit),
      wonValue: Math.round(wonValue), openCount: open.length, wonCount: won.length,
    },
    byMonth: months,
    byStage,
  };
}
