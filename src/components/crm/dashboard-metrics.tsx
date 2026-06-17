"use client";

import { motion } from "framer-motion";
import { Users, Building2, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n || 0).toLocaleString()}`;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  delay?: number;
}

function MetricCard({ title, value, change, icon: Icon, delay = 0 }: MetricCardProps) {
  const hasChange = change !== undefined && change !== null && !Number.isNaN(change);
  const isPositive = (change ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="group relative bg-gradient-to-b from-[#151619] to-[#0f1011] border border-white/[0.07] rounded-xl p-5 overflow-hidden hover:border-white/[0.12] transition-colors"
    >
      {/* subtle top sheen for depth */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[#8a8f98] text-[12px] font-medium uppercase tracking-wide">{title}</p>
          <p className="text-[28px] leading-tight font-semibold text-[#f7f8f8] mt-2 tabular-nums">{value}</p>
          {hasChange && (
            <div className={`flex items-center gap-1 mt-2 ${isPositive ? "text-[#10b981]" : "text-[#ef4444]"}`}>
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span className="text-[12px] font-medium tabular-nums">{Math.abs(change!)}%</span>
              <span className="text-[#62666d] text-[12px]">vs last month</span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#5e6ad2]/[0.12] ring-1 ring-inset ring-[#5e6ad2]/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#9aa4f2]" />
        </div>
      </div>
    </motion.div>
  );
}

interface Stats { contacts?: number; companies?: number; deals?: number; revenueWon?: number; revenueOpen?: number; }
interface Trends { contacts?: number; companies?: number; deals?: number; revenue?: number; }

export function DashboardMetrics({ stats, trends }: { stats?: Stats; trends?: Trends }) {
  const metrics = [
    { title: "Total Contacts", value: (stats?.contacts ?? 0).toLocaleString(), change: trends?.contacts, icon: Users },
    { title: "Companies", value: (stats?.companies ?? 0).toLocaleString(), change: trends?.companies, icon: Building2 },
    { title: "Open Pipeline", value: fmtMoney(stats?.revenueOpen ?? 0), change: trends?.deals, icon: DollarSign },
    { title: "Won Revenue", value: fmtMoney(stats?.revenueWon ?? 0), change: trends?.revenue, icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, i) => (
        <MetricCard key={metric.title} {...metric} delay={i * 0.08} />
      ))}
    </div>
  );
}
