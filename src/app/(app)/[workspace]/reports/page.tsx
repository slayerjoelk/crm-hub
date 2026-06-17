"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BarChart3, Play, Save, Trash2, Bookmark, ChevronDown } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

const OBJECTS = ["deals", "leads", "contacts", "companies", "cases", "campaigns"];
const input = "h-9 px-3 rounded-lg bg-[#08090a] border border-white/[0.08] text-[13px] text-[#d0d6e0] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/40";
const COLORS = ["#5e6ad2", "#828fff", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#34d399"];

function humanize(s: string) { return s.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, c => c.toUpperCase()); }
function fmt(n: number) { if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n/1e3).toFixed(1)}K`; return String(Math.round(n||0)); }

export default function ReportsPage() {
  const [schema, setSchema] = useState<any>({});
  const [saved, setSaved] = useState<any[]>([]);
  const [object, setObject] = useState("deals");
  const [metric, setMetric] = useState<"count" | "sum">("count");
  const [measure, setMeasure] = useState("value");
  const [groupBy, setGroupBy] = useState("status");
  const [rows, setRows] = useState<{ label: string; value: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  async function loadSaved() {
    const r = await fetch("/api/reports", { credentials: "include" }).then(r => r.json());
    setSaved(r.data || []); setSchema(r.schema || {});
  }
  useEffect(() => { loadSaved(); }, []);

  // Keep groupBy/measure valid for the chosen object
  useEffect(() => {
    const s = schema[object];
    if (s) {
      if (!s.groupBy.includes(groupBy)) setGroupBy(s.groupBy[0]);
      if (metric === "sum" && s.measures.length && !s.measures.includes(measure)) setMeasure(s.measures[0]);
      if (metric === "sum" && s.measures.length === 0) setMetric("count");
    }
  }, [object, schema]); // eslint-disable-line

  const run = useCallback(async () => {
    setLoading(true);
    const cfg = { object, metric, measure: metric === "sum" ? measure : undefined, groupBy };
    try {
      const r = await fetch("/api/reports/run", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) }).then(r => r.json());
      setRows(r.data?.rows || []); setTotal(r.data?.total || 0);
    } catch {}
    setLoading(false);
  }, [object, metric, measure, groupBy]);

  useEffect(() => { run(); }, [run]);

  async function save() {
    const name = prompt("Save report as:", `${humanize(object)} by ${humanize(groupBy)}`);
    if (!name) return;
    await fetch("/api/reports", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, config: { object, metric, measure, groupBy } }) });
    loadSaved();
  }
  async function loadReport(r: any) {
    const c = r.config || {};
    setObject(c.object); setMetric(c.metric); setMeasure(c.measure || "value"); setGroupBy(c.groupBy);
  }
  async function del(r: any) { if (!confirm(`Delete report "${r.name}"?`)) return; await fetch(`/api/reports/${r.id}`, { method: "DELETE", credentials: "include" }); loadSaved(); }

  const s = schema[object] || { groupBy: [], measures: [] };
  const measures: string[] = s.measures || [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center"><BarChart3 className="w-4 h-4 text-white" /></div><h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">Reports</h1></div>
        <p className="text-[13px] text-[#8a8f98]">Build a report — pick an object, a metric, and how to group it.</p>
      </div>

      {/* Builder bar */}
      <div className="rounded-xl border border-white/[0.07] bg-gradient-to-b from-[#141517] to-[#0f1011] p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Object"><select className={input} value={object} onChange={e => setObject(e.target.value)}>{OBJECTS.map(o => <option key={o} value={o}>{humanize(o)}</option>)}</select></Field>
          <Field label="Metric"><select className={input} value={metric} onChange={e => setMetric(e.target.value as any)}><option value="count">Count</option>{measures.length > 0 && <option value="sum">Sum of…</option>}</select></Field>
          {metric === "sum" && measures.length > 0 && <Field label="Measure"><select className={input} value={measure} onChange={e => setMeasure(e.target.value)}>{measures.map(m => <option key={m} value={m}>{humanize(m)}</option>)}</select></Field>}
          <Field label="Group by"><select className={input} value={groupBy} onChange={e => setGroupBy(e.target.value)}>{s.groupBy.map((g: string) => <option key={g} value={g}>{humanize(g)}</option>)}</select></Field>
          <button onClick={run} className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#d0d6e0] text-[13px] font-medium flex items-center gap-2 hover:bg-white/[0.06]"><Play className="w-3.5 h-3.5" /> Run</button>
          <button onClick={save} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#5e6ad2] to-[#828fff] text-white text-[13px] font-medium flex items-center gap-2 hover:shadow-lg"><Save className="w-3.5 h-3.5" /> Save</button>
        </div>
      </div>

      {/* Result */}
      <div className="rounded-xl border border-white/[0.07] bg-gradient-to-b from-[#141517] to-[#0f1011] p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-[#f7f8f8]">{metric === "sum" ? `Sum of ${humanize(measure)}` : "Count"} of {humanize(object)} by {humanize(groupBy)}</h2>
          <span className="text-[12px] text-[#62666d] tabular-nums">total {metric === "sum" ? fmt(total) : total.toLocaleString()}</span>
        </div>
        <div className="h-64">
          {loading ? <div className="h-full w-full rounded-lg bg-white/[0.02] animate-pulse" />
          : rows.length === 0 ? <div className="py-10 text-center text-[12px] text-[#62666d]">No data for this report.</div>
          : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 6, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#62666d", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#62666d", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(Number(v))} width={48} />
                <Tooltip contentStyle={{ background: "#16171a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }} labelStyle={{ color: "#8a8f98" }} cursor={{ fill: "rgba(255,255,255,0.03)" }} formatter={(v: any) => [metric === "sum" ? fmt(Number(v)) : v, "Value"]} />
                <Bar dataKey="value" radius={[4,4,0,0]}>{rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Saved reports */}
      <div>
        <h3 className="text-[12px] font-medium text-[#8a8f98] uppercase tracking-wide mb-2">Saved reports</h3>
        {saved.length === 0 ? <p className="text-[12px] text-[#62666d]">No saved reports yet — build one above and hit Save.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {saved.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.10] transition-colors">
                <button onClick={() => loadReport(r)} className="flex items-center gap-2 min-w-0 text-left"><Bookmark className="w-3.5 h-3.5 text-[#9aa4f2] shrink-0" /><span className="text-[13px] text-[#d0d6e0] truncate">{r.name}</span></button>
                <button onClick={() => del(r)} className="w-6 h-6 rounded flex items-center justify-center text-[#62666d] hover:text-red-400 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><span className="text-[10px] font-medium text-[#8a8f98] uppercase tracking-wide">{label}</span>{children}</div>;
}
