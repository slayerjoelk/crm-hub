"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, Building2, DollarSign, Target, CheckSquare, Activity,
  ArrowLeft, TrendingUp, Zap, Clock
} from "lucide-react";
import { GlassCard, StaggerContainer, StaggerItem, AnimatedCounter, PageFade } from "@/components/crm/motion";

interface OwnerDashboardData {
  stats: {
    totalContacts: number;
    totalDeals: number;
    totalTasks: number;
    combinedMRR: number;
    leadsThisMonth: number;
  };
  businesses: {
    id: string;
    slug: string;
    name: string;
    contacts: number;
    deals: number;
    tasks: number;
  }[];
  recentActivity: any[];
}

function KpiCard({ title, value, icon: Icon, color, prefix = "", suffix = "" }: any) {
  return (
    <StaggerItem>
      <GlassCard className="p-5 relative overflow-hidden group" hover>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent via-transparent to-[var(--card-glow)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full blur-2xl" style={{ "--card-glow": color + "10" } as any} />
        <div className="flex items-start justify-between relative z-10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
            <Icon className="w-4.5 h-4.5" style={{ color }} strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-4 relative z-10">
          <div className="text-[28px] font-semibold text-primary-text tracking-tight tabular-nums">
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
          </div>
          <div className="text-[13px] text-muted mt-1">{title}</div>
        </div>
      </GlassCard>
    </StaggerItem>
  );
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/owner/dashboard", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((d) => { setData(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#08090a]">
        <div className="w-8 h-8 border-2 border-[#5e6ad2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08090a] text-zinc-400">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => router.back()} className="text-violet-400 hover:underline flex items-center gap-1 justify-center">
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats ?? { totalContacts: 0, totalDeals: 0, totalTasks: 0, combinedMRR: 0, leadsThisMonth: 0 };

  const kpis = [
    { title: "Total Contacts", value: stats.totalContacts, icon: Users, color: "#3b82f6" },
    { title: "Total Deals", value: stats.totalDeals, icon: Target, color: "#f59e0b" },
    { title: "Total Tasks", value: stats.totalTasks, icon: CheckSquare, color: "#8b5cf6" },
    { title: "Combined MRR", value: stats.combinedMRR, icon: DollarSign, color: "#10b981", prefix: "$" },
    { title: "Leads This Month", value: stats.leadsThisMonth, icon: TrendingUp, color: "#ec4899" },
  ];

  return (
    <PageFade className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-text tracking-tight">Owner Dashboard</h1>
          <p className="text-[13px] text-muted mt-0.5">Cross-business overview for all your organizations</p>
        </div>
        <button onClick={() => router.back()} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-zinc-900/80 border border-zinc-800/50 text-[13px] text-zinc-300 hover:border-zinc-700 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map(k => <KpiCard key={k.title} {...k} />)}
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-5" hover>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-secondary">Business Breakdown</h3>
            <Zap className="w-4 h-4 text-muted" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-zinc-800/50">
                  <th className="text-left py-2 text-zinc-500 font-medium">Business</th>
                  <th className="text-right py-2 text-zinc-500 font-medium">Contacts</th>
                  <th className="text-right py-2 text-zinc-500 font-medium">Deals</th>
                  <th className="text-right py-2 text-zinc-500 font-medium">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {(data?.businesses ?? []).map((biz, i) => (
                  <motion.tr
                    key={biz.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-zinc-800/30 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2.5 text-zinc-200 font-medium">{biz.name}</td>
                    <td className="py-2.5 text-right text-zinc-400 tabular-nums">{biz.contacts.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-zinc-400 tabular-nums">{biz.deals.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-zinc-400 tabular-nums">{biz.tasks.toLocaleString()}</td>
                  </motion.tr>
                ))}
                {(!data?.businesses || data.businesses.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">No business data yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="p-5" hover>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-secondary">Recent Activity (All Businesses)</h3>
            <Clock className="w-4 h-4 text-muted" />
          </div>
          <div className="space-y-0 relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/[0.04]" />
            {(data?.recentActivity ?? []).slice(0, 8).map((act, i) => (
              <motion.div
                key={`${act.id}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 py-2.5 pl-1 group hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="relative z-10 w-6 h-6 rounded-full bg-elevated border border-white/[0.08] flex items-center justify-center shrink-0">
                  <Activity className="w-3 h-3 text-zinc-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] text-secondary leading-snug truncate">{act.body || "Activity"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-faint">{act.type || "note"}</span>
                    <span className="text-faint">·</span>
                    <span className="text-[11px] text-faint">{act.createdAt ? new Date(act.createdAt).toLocaleDateString() : "-"}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            {(!data?.recentActivity || data.recentActivity.length === 0) && (
              <div className="py-8 text-center text-sm text-zinc-500">No activity yet.</div>
            )}
          </div>
        </GlassCard>
      </div>
    </PageFade>
  );
}
