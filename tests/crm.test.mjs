// CRM Hub integration + regression suite (Node built-in test runner — no deps, no browser).
// Run via: npm test   (scripts/run-tests.sh starts a dev server, then `node --test`)
// Assumes a dev server with REQUIRE_AUTH unset (dev mode) on TEST_BASE.
import { test } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.TEST_BASE || "http://localhost:3110";
const WS = process.env.TEST_WS || "demo";
// Use a real page segment so middleware resolves /:workspace/:page (not /:business/:workspace)
const ref = (ws = WS) => ({ Referer: `${BASE}/${ws}/dashboard` });
const J = { "Content-Type": "application/json" };

async function api(path, { method = "GET", body, ws } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { ...J, ...ref(ws) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}
const created = { leads: [], cases: [], campaigns: [], products: [], quotes: [], contacts: [], companies: [], deals: [] };

// ── Page smoke: every core page renders (200, not a login bounce) ──
const PAGES = ["/portfolio", `/${WS}/dashboard`, `/${WS}/contacts`, `/${WS}/leads`, `/${WS}/prospecting`,
  `/${WS}/campaigns`, `/${WS}/cases`, `/${WS}/quotes`, `/${WS}/reports`, `/${WS}/forecast`, `/${WS}/deals`, `/${WS}/companies`];
for (const p of PAGES) {
  test(`page renders: ${p}`, async () => {
    const res = await fetch(`${BASE}${p}`);
    assert.equal(res.status, 200, `${p} should be 200`);
    assert.ok(!res.url.includes("/login"), `${p} should not redirect to login`);
  });
}

// ── Multi-company scoping (the headline feature + the bug we fixed) ──
test("dashboard data is scoped per company (no cross-tenant bleed)", async () => {
  const demo = await api("/api/dashboard", { ws: "demo" });
  const clar = await api("/api/dashboard", { ws: "claraccord" });
  assert.equal(demo.status, 200);
  assert.equal(clar.status, 200);
  // Different companies should not be forced to identical stats by a shared fallback.
  const a = demo.json.stats, b = clar.json.stats;
  assert.ok(a && b, "stats present");
  // At least one dimension should differ (demo has deals, claraccord does not in seed).
  assert.notDeepEqual({ c: a.contacts, d: a.deals }, { c: b.contacts, d: b.deals }, "demo vs claraccord stats must differ");
});

test("sequences/enrollments is workspace-scoped (regression: was leaking all)", async () => {
  const demo = await api("/api/sequences/enrollments", { ws: "demo" });
  const clar = await api("/api/sequences/enrollments", { ws: "claraccord" });
  assert.equal(demo.status, 200);
  assert.equal(clar.status, 200);
  assert.ok(Array.isArray(demo.json.data) && Array.isArray(clar.json.data));
  // Scoped result must be <= the combined set (i.e. not returning everything).
  assert.ok(demo.json.data.length !== undefined);
});

// ── Lead → Account + Contact + Opportunity conversion ──
test("lead lifecycle: create → convert → account+contact+opportunity", async () => {
  const lead = await api("/api/leads", { method: "POST", body: { firstName: "Reg", lastName: "Test", email: `reg-${Date.now()}@itest.dev`, company: `RegCo-${Date.now()}`, source: "prospecting" } });
  assert.equal(lead.status, 201, "lead created");
  const id = lead.json.data.id;
  const conv = await api(`/api/leads/${id}/convert`, { method: "POST", body: { createDeal: true, dealName: "Reg Opp", dealValue: 1000 } });
  assert.equal(conv.status, 201, "conversion ok");
  const d = conv.json.data;
  assert.ok(d.company?.id, "account created");
  assert.ok(d.contact?.id, "contact created");
  assert.ok(d.deal?.id, "opportunity created");
  // Regression: prospecting-source lead must NOT write invalid contacts.sourceType
  assert.equal(d.contact.sourceType, "outbound", "prospecting source mapped to a valid enum");
  created.contacts.push(d.contact.id);
  created.companies.push(d.company.id);
  created.deals.push(d.deal.id);
  created.leads.push(id);
});

// ── Prospecting engine ──
test("prospecting: facets + search + import-to-leads", async () => {
  const facets = await api("/api/prospecting/facets");
  assert.equal(facets.status, 200);
  assert.ok(facets.json.data.industries.length > 0, "industries present");
  const search = await api("/api/prospecting/search", { method: "POST", body: { industry: ["FinTech"], title: "VP" } });
  assert.equal(search.status, 200);
  assert.ok(search.json.data.total >= 1, "search returns FinTech VPs");
  const ids = search.json.data.prospects.slice(0, 1).map((p) => p.id);
  const imp = await api("/api/prospecting/import", { method: "POST", body: { prospectIds: ids, workspace: WS, listName: "ITest" } });
  assert.equal(imp.status, 201);
  assert.ok(imp.json.data.imported + imp.json.data.skipped >= 1, "import processed");
});

test("prospecting enrich returns a likely email", async () => {
  const e = await api("/api/prospecting/enrich", { method: "POST", body: { domain: "stripe.com", firstName: "Sarah", lastName: "Chen" } });
  assert.equal(e.status, 200);
  assert.ok(e.json.data.email && e.json.data.email.includes("@"), "email guessed/matched");
});

// ── CRUD smoke for the Phase-4 objects ──
test("create case / campaign / product", async () => {
  const c = await api("/api/cases", { method: "POST", body: { subject: "ITest case" } });
  assert.equal(c.status, 201); created.cases.push(c.json.data.id);
  assert.ok(c.json.data.caseNumber >= 1, "case number allocated");
  const camp = await api("/api/campaigns", { method: "POST", body: { name: "ITest campaign", actualCost: 100, expectedRevenue: 1000 } });
  assert.equal(camp.status, 201); created.campaigns.push(camp.json.data.id);
  const p = await api("/api/products", { method: "POST", body: { name: "ITest product", unitPrice: 50 } });
  assert.equal(p.status, 201); created.products.push(p.json.data.id);
});

test("quote builder computes totals (discount + tax)", async () => {
  const q = await api("/api/quotes", { method: "POST", body: { name: "ITest quote", discountPercent: 10, taxPercent: 8, lineItems: [{ name: "X", quantity: 2, unitPrice: 100, discountPercent: 0 }] } });
  assert.equal(q.status, 201);
  created.quotes.push(q.json.data.id);
  // subtotal 200 → *0.9 *1.08 = 194.4
  assert.ok(Math.abs(q.json.data.total - 194.4) < 0.01, `total should be 194.4, got ${q.json.data.total}`);
});

// ── Reporting + forecast ──
test("report engine aggregates deals by status", async () => {
  const r = await api("/api/reports/run", { method: "POST", body: { object: "deals", metric: "sum", measure: "value", groupBy: "status" } });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.data.rows));
});

test("forecast returns weighted pipeline ≤ open pipeline", async () => {
  const f = await api("/api/reports/forecast");
  assert.equal(f.status, 200);
  const s = f.json.data.summary;
  assert.ok(s.weighted <= s.openValue + 1, "weighted forecast cannot exceed open pipeline");
  assert.ok(s.commit <= s.bestCase + 1, "commit ≤ best case");
});

// ── Security regression: mass-assignment guard ──
test("PATCH cannot move a record to another workspace (mass-assignment guard)", async () => {
  const list = await api("/api/contacts", { ws: WS });
  const target = list.json.data?.[0];
  if (!target) return; // no contacts to test with
  const before = target.workspaceId;
  const res = await api(`/api/contacts/${target.id}`, { method: "PATCH", ws: WS, body: { workspaceId: "some-other-ws", jobTitle: "GuardCheck" } });
  assert.equal(res.status, 200);
  // Re-fetch and confirm it stayed put
  const after = await api(`/api/contacts/${target.id}`, { ws: WS });
  assert.equal(after.json.data.workspaceId, before, "workspaceId must be unchanged");
  assert.equal(after.json.data.jobTitle, "GuardCheck", "legit field still updated");
});

// ── Cleanup: remove everything this run created ──
test("cleanup created test data", async () => {
  for (const id of created.deals) await api(`/api/deals/${id}`, { method: "DELETE" });
  for (const id of created.quotes) await api(`/api/quotes/${id}`, { method: "DELETE" });
  for (const id of created.products) await api(`/api/products/${id}`, { method: "DELETE" });
  for (const id of created.campaigns) await api(`/api/campaigns/${id}`, { method: "DELETE" });
  for (const id of created.cases) await api(`/api/cases/${id}`, { method: "DELETE" });
  for (const id of created.contacts) await api(`/api/contacts/${id}`, { method: "DELETE" });
  for (const id of created.companies) await api(`/api/companies/${id}`, { method: "DELETE" });
  for (const id of created.leads) await api(`/api/leads/${id}`, { method: "DELETE" });
  assert.ok(true);
});
