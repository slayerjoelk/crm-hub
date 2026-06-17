"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, CheckCircle2, ArrowRight, Inbox } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { DashboardMetrics, fmtMoney } from "@/components/crm/dashboard-metrics";

interface DashboardData {
  stats?: any;
  trends?: any;
  monthlyRevenue?: { name: string; revenue: number }[];
  pipelineDistribution?: { name: string; value: number }[];
  deals?: any[];
  activities?: any[];
}

const card = "relative bg-gradient-to-b from-[#141517] to-[#0f1011] border border-white/[0.07] rounded-xl overflow-hidden";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [d, t] = await Promise.all([
          fetch("/api/dashboard", { credentials: "include" }).then(r => r.json()),
          fetch("/api/tasks", { credentials: "include" }).then(r => r.json()).catch(() => ({ data: [] })),
        ]);
        setData(d);
        setTasks((t.data || t || []).filter((x: any) => x.status !== "done" && x.status !== "cancelled").slice(0, 5));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const revenue = data?.monthlyRevenue || [];
  const pipeline = (data?.pipelineDistribution || []).filter(p => p.name !== "No pipeline" && p.name !== "No open deals");
  const maxStage = Math.max(1, ...pipeline.map(p => p.value));
  const deals = data?.deals || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">Dashboard</h1>
        <p className="text-[#8a8f98] text-[13px] mt-1">A live view of your pipeline, revenue, and follow-ups.</p>
      </div>

      <DashboardMetrics stats={data?.stats} trends={data?.trends} />

      {/* Revenue + pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${card} p-5 lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#f7f8f8] text-[14px] font-semibold">Revenue (last 12 months)</h2>
            <span className="text-[12px] text-[#62666d]">open + won deals</span>
          </div>
          <div className="h-60">
            {loading ? <Skeleton /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue} margin={{ top: 6, right: 8, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5e6ad2" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#5e6ad2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#62666d", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#62666d", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtMoney(Number(v))} width={64} />
                  <Tooltip
                    contentStyle={{ background: "#16171a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: "#8a8f98" }} itemStyle={{ color: "#f7f8f8" }}
                    formatter={(v: any) => [fmtMoney(Number(v)), "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#828fff" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={`${card} p-5`}>
          <h2 className="text-[#f7f8f8] text-[14px] font-semibold mb-4">Open pipeline by stage</h2>
          <div className="space-y-3">
            {loading ? <Skeleton /> : pipeline.length === 0 ? (
              <Empty label="No open deals yet" />
            ) : pipeline.map((p, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="text-[#d0d6e0] truncate">{p.name}</span>
                  <span className="text-[#8a8f98] tabular-nums shrink-0 ml-2">{fmtMoney(p.value)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(p.value / maxStage) * 100}%` }} transition={{ delay: 0.2 + i * 0.05 }} className="h-full rounded-full bg-gradient-to-r from-[#5e6ad2] to-[#828fff]" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent deals + tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#f7f8f8] text-[14px] font-semibold">Recent Deals</h2>
            <a href="deals" className="text-[#9aa4f2] text-[12px] font-medium hover:text-white flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></a>
          </div>
          <div className="space-y-2">
            {loading ? <Skeleton /> : deals.length === 0 ? <Empty label="No deals yet" /> : deals.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#5e6ad2]/[0.12] ring-1 ring-inset ring-[#5e6ad2]/15 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-[#9aa4f2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#f7f8f8] text-[13px] font-medium truncate">{d.name}</p>
                    <p className="text-[#62666d] text-[11px] capitalize">{d.status}</p>
                  </div>
                </div>
                <span className="text-[#10b981] text-[13px] font-medium tabular-nums shrink-0 ml-2">{fmtMoney(Number(d.value) || 0)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#f7f8f8] text-[14px] font-semibold">Open Tasks</h2>
            <a href="tasks" className="text-[#9aa4f2] text-[12px] font-medium hover:text-white flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></a>
          </div>
          <div className="space-y-2">
            {loading ? <Skeleton /> : tasks.length === 0 ? <Empty label="You're all caught up" /> : tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                <CheckCircle2 className="w-4 h-4 text-[#62666d] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[#f7f8f8] text-[13px] truncate">{t.title}</p>
                  <p className="text-[#62666d] text-[11px]">{t.dueDate ? `Due ${new Date(t.dueDate).toLocaleDateString()}` : "No due date"}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize shrink-0 ${
                  t.priority === "critical" || t.priority === "high" ? "bg-[#f59e0b]/10 text-[#f59e0b]" : "bg-white/[0.05] text-[#8a8f98]"
                }`}>{t.priority || "medium"}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Skeleton() {
  return <div className="h-full w-full min-h-[80px] rounded-lg bg-white/[0.02] animate-pulse" />;
}
function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Inbox className="w-6 h-6 text-[#3a3d44] mb-2" />
      <p className="text-[12px] text-[#62666d]">{label}</p>
    </div>
  );
}
