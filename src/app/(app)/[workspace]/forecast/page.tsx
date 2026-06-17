"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Target, Gauge, Layers, Trophy } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

function fmt(n: number) { if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `$${(n/1e3).toFixed(1)}K`; return `$${Math.round(n||0)}`; }
const card = "relative bg-gradient-to-b from-[#141517] to-[#0f1011] border border-white/[0.07] rounded-xl overflow-hidden";

export default function ForecastPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/forecast", { credentials: "include" }).then(r => r.json()).then(j => { setData(j.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const s = data?.summary || {};
  const maxStage = Math.max(1, ...(data?.byStage || []).map((x: any) => x.value));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5e6ad2] to-[#828fff] flex items-center justify-center"><Gauge className="w-4 h-4 text-white" /></div><h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">Forecast</h1></div>
        <p className="text-[13px] text-[#8a8f98]">Weighted pipeline — deal value × win probability, projected by close month.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Kpi icon={TrendingUp} label="Weighted forecast" value={fmt(s.weighted || 0)} accent />
        <Kpi icon={Target} label="Commit (≥70%)" value={fmt(s.commit || 0)} />
        <Kpi icon={Layers} label="Best case (≥40%)" value={fmt(s.bestCase || 0)} />
        <Kpi icon={Gauge} label={`Open pipeline (${s.openCount || 0})`} value={fmt(s.openValue || 0)} />
        <Kpi icon={Trophy} label={`Won (${s.wonCount || 0})`} value={fmt(s.wonValue || 0)} won />
      </div>

      {/* Forecast by month */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`${card} p-5 mb-6`}>
        <h2 className="text-[14px] font-semibold text-[#f7f8f8] mb-4">Forecast by close month</h2>
        <div className="h-64">
          {loading ? <Skel /> : (data?.byMonth?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byMonth} margin={{ top: 6, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#62666d", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#62666d", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(Number(v))} width={56} />
                <Tooltip contentStyle={{ background: "#16171a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }} labelStyle={{ color: "#8a8f98" }} formatter={(v: any, n: any) => [fmt(Number(v)), n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="weighted" name="Weighted" fill="#5e6ad2" radius={[4,4,0,0]} />
                <Bar dataKey="won" name="Won" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />)}
        </div>
      </motion.div>

      {/* Pipeline by stage */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${card} p-5`}>
        <h2 className="text-[14px] font-semibold text-[#f7f8f8] mb-4">Open pipeline by stage</h2>
        {loading ? <Skel /> : (data?.byStage?.length ? (
          <div className="space-y-3">
            {data.byStage.map((st: any, i: number) => (
              <div key={i}>
                <div className="flex items-center justify-between text-[12px] mb-1"><span className="text-[#d0d6e0]">{st.label} <span className="text-[#62666d]">· {st.count}</span></span><span className="text-[#8a8f98] tabular-nums">{fmt(st.value)}</span></div>
                <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(st.value / maxStage) * 100}%` }} transition={{ delay: 0.15 + i * 0.05 }} className="h-full rounded-full bg-gradient-to-r from-[#5e6ad2] to-[#828fff]" /></div>
              </div>
            ))}
          </div>
        ) : <Empty />)}
      </motion.div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent, won }: any) {
  return (
    <div className={`${card} p-4`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />
      <div className="flex items-center gap-1.5 mb-1.5 text-[#62666d]"><Icon className="w-3.5 h-3.5" /><span className="text-[10px] uppercase tracking-wide truncate">{label}</span></div>
      <div className={`text-[22px] font-semibold tabular-nums ${won ? "text-[#34d399]" : accent ? "text-[#9aa4f2]" : "text-[#f7f8f8]"}`}>{value}</div>
    </div>
  );
}
function Skel() { return <div className="h-full w-full min-h-[120px] rounded-lg bg-white/[0.02] animate-pulse" />; }
function Empty() { return <div className="py-10 text-center text-[12px] text-[#62666d]">No open deals to forecast yet.</div>; }
