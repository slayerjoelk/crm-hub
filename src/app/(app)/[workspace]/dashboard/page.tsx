"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Users, Building2, DollarSign, Target, Clock, Calendar, ChevronRight, Zap, Sparkles, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";
import { GlassCard, StaggerContainer, StaggerItem, AnimatedCounter, AnimatedBadge, PageFade } from "@/components/crm/motion";

const COLORS = ["#5e6ad2", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function Sparkline({ data, color, up }: { data: number[]; color: string; up: boolean }) {
  const pts = data.map((v, i) => ({ x: i, v }));
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  return (
    <div className="flex items-end gap-0.5 h-8 opacity-60">
      {data.map((v, i) => {
        const h = ((v - min) / range) * 100;
        return <motion.div key={i} className="w-1 rounded-full" style={{ backgroundColor: color, height: `${Math.max(8, h)}%` }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.03, duration: 0.4, ease: "easeOut" }} />
      })}
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, trend, trendLabel, color, sparkData, prefix = "", suffix = "" }: any) {
  const up = trend >= 0;
  return (
    <StaggerItem>
      <GlassCard className="p-5 relative overflow-hidden group" hover>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent via-transparent to-[var(--card-glow)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full blur-2xl" style={{ "--card-glow": color + "10" } as any} />
        <div className="flex items-start justify-between relative z-10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
            <Icon className="w-4.5 h-4.5" style={{ color }} strokeWidth={1.5} />
          </div>
          {sparkData && <Sparkline data={sparkData} color={color} up={up} />}
        </div>
        <div className="mt-4 relative z-10">
          <div className="text-[28px] font-semibold text-primary-text tracking-tight tabular-nums">
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[13px] text-muted">{title}</span>
            <div className={`flex items-center gap-1 text-[11px] font-semibold ${up ? "text-success" : "text-danger"}`}>
              {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend)}%
              <span className="text-faint ml-0.5">{trendLabel}</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </StaggerItem>
  );
}

function FunnelChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="space-y-2">
      {data.map((stage, i) => {
        const pct = (stage.value / max) * 100;
        return (
          <motion.div key={i} className="flex items-center gap-3">
            <div className="w-20 text-[11px] text-muted truncate text-right">{stage.name}</div>
            <div className="flex-1 h-6 bg-white/[0.03] rounded-md overflow-hidden relative">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-md"
                style={{ background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}cc, ${COLORS[i % COLORS.length]}66)` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
              />
              <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-semibold text-white z-10">
                {stage.value}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function ActivityDot({ type }: { type: string }) {
  const colors: Record<string, string> = { email: "#3b82f6", call: "#10b981", meeting: "#f59e0b", note: "#8b5cf6", task: "#ef4444", sms: "#ec4899" };
  return <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[type] || "#5e6ad2" }} />;
}

function ActivityTimeline({ activities }: { activities: any[] }) {
  if (!activities || activities.length === 0) return (
    <GlassCard className="p-8 text-center" hover={false}>
      <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
        <Activity className="w-5 h-5 text-muted" />
      </div>
      <p className="text-sm text-muted">No activity yet. Start logging interactions.</p>
    </GlassCard>
  );
  return (
    <div className="space-y-0 relative">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/[0.04]" />
      {activities.slice(0, 8).map((act, i) => (
        <motion.div
          key={`${act.id}-${i}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3 py-2.5 pl-1 group cursor-pointer hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition-colors"
        >
          <div className="relative z-10 w-6 h-6 rounded-full bg-elevated border border-white/[0.08] flex items-center justify-center shrink-0">
            <ActivityDot type={act.type || "note"} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] text-secondary leading-snug truncate">{act.body || act.description || "Activity"}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-faint">{act.type || "note"}</span>
              <span className="text-faint">·</span>
              <span className="text-[11px] text-faint">{act.createdAt ? new Date(act.createdAt).toLocaleDateString() : "-"}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard", { credentials: "include" })
      .then(r => r.json())
      .then(setData);
  }, []);

  const chartData = data?.monthlyRevenue ?? [];
  const pipelineData = data?.pipelineDistribution ?? [];
  const pipelineFunnel = useMemo(() => {
    if (!data?.pipelineDistribution?.length) return [];
    return data.pipelineDistribution.sort((a: any, b: any) => b.value - a.value);
  }, [data]);

  const kpis = [
    { title: "Contacts", value: data?.stats?.contacts ?? 0, icon: Users, trend: data?.trends?.contacts ?? 0, trendLabel: "vs last month", color: "#3b82f6", sparkData: data?.history?.contacts },
    { title: "Companies", value: data?.stats?.companies ?? 0, icon: Building2, trend: data?.trends?.companies ?? 0, trendLabel: "vs last month", color: "#8b5cf6", sparkData: data?.history?.companies },
    { title: "Deals", value: data?.stats?.deals ?? 0, icon: Target, trend: data?.trends?.deals ?? 0, trendLabel: "vs last month", color: "#f59e0b", sparkData: data?.history?.deals },
    { title: "Revenue Won", value: data?.stats?.revenueWon ?? 0, icon: DollarSign, trend: data?.trends?.revenue ?? 0, trendLabel: "vs last month", color: "#10b981", prefix: "$", sparkData: data?.history?.revenue },
  ];

  return (
    <PageFade className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary-text tracking-tight">Dashboard</h1>
            <p className="text-[13px] text-muted mt-0.5">Overview of your workspace performance</p>
          </div>
          <div className="flex items-center gap-2">
            <AnimatedBadge color="brand"><Zap className="w-3 h-3" /> Live</AnimatedBadge>
          </div>
        </div>
      </motion.div>

      {/* KPI Row */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => <KpiCard key={k.title} {...k} />)}
      </StaggerContainer>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <GlassCard className="lg:col-span-2 p-5" hover>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-secondary">Revenue Overview</h3>
            <div className="flex items-center gap-1 text-[11px] text-success bg-success/10 px-2 py-0.5 rounded-md border border-success/20">
              <TrendingUp className="w-3 h-3" /> +18% this month
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5e6ad2" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#5e6ad2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" stroke="transparent" tick={{ fill: "#62666d", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="transparent" tick={{ fill: "#62666d", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => "$" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip
                  contentStyle={{ background: "#191a1b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", color: "#f7f8f8", fontSize: 12 }}
                  itemStyle={{ color: "#f7f8f8" }}
                  formatter={(value: any) => [`$${value?.toLocaleString?.() ?? value}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#5e6ad2" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Pipeline Funnel */}
        <GlassCard className="p-5" hover>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-secondary">Pipeline Funnel</h3>
            <AnimatedBadge color="info"><Sparkles className="w-3 h-3" /> AI</AnimatedBadge>
          </div>
          <div className="h-64 flex items-center">
            {pipelineFunnel.length > 0 ? (
              <FunnelChart data={pipelineFunnel} />
            ) : (
              <div className="text-center w-full text-muted text-sm py-8">No pipeline data yet</div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Deals */}
        <GlassCard className="p-5" hover>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-secondary">Recent Deals</h3>
            <motion.button whileHover={{ x: 2 }} onClick={() => router.push("./deals")} className="text-[11px] text-brand flex items-center gap-0.5 hover:text-brand-light transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </motion.button>
          </div>
          <div className="space-y-1">
            {(data?.deals ?? []).slice(0, 6).map((deal: any, i: number) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => router.push(`./deals/${deal.id}`)}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-brand" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-secondary">{deal.name}</div>
                    <div className="text-[11px] text-faint mt-0.5">{deal.stage || "No stage"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-semibold text-secondary tabular-nums">{deal.value ? "$" + deal.value.toLocaleString() : "—"}</div>
                  {deal.expectedCloseDate && <div className="text-[11px] text-faint flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" />{new Date(deal.expectedCloseDate).toLocaleDateString()}</div>}
                </div>
              </motion.div>
            ))}
            {(!data?.deals || data.deals.length === 0) && (
              <div className="text-center text-sm text-muted py-8">No deals yet. <button onClick={() => router.push("./deals")} className="text-brand hover:underline">Create one</button>.</div>
            )}
          </div>
        </GlassCard>

        {/* Activity Timeline */}
        <GlassCard className="p-5" hover>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-secondary">Recent Activity</h3>
            <AnimatedBadge color="muted"><Clock className="w-3 h-3" /> Live</AnimatedBadge>
          </div>
          <ActivityTimeline activities={data?.activities ?? []} />
        </GlassCard>
      </div>
    </PageFade>
  );
}
