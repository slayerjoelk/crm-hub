"use client";

import { motion } from "framer-motion";
import { Users, Building2, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  delay?: number;
}

function MetricCard({ title, value, change, icon: Icon, delay = 0 }: MetricCardProps) {
  const isPositive = change && change >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-[#0f1011] border border-white/[0.06] rounded-xl p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#8a8f98] text-sm font-medium">{title}</p>
          <p className="text-3xl font-medium text-[#f7f8f8] mt-2">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 ${isPositive ? "text-[#10b981]" : "text-[#ef4444]"}`}>
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
              <span className="text-[#62666d] text-sm">vs last month</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#191a1b] flex items-center justify-center">
          <Icon className="w-6 h-6 text-[#5e6ad2]" />
        </div>
      </div>
    </motion.div>
  );
}

export function DashboardMetrics() {
  const metrics = [
    { title: "Total Contacts", value: "2,847", change: 12.5, icon: Users },
    { title: "Active Companies", value: "483", change: 8.2, icon: Building2 },
    { title: "Pipeline Value", value: "$1.2M", change: 23.1, icon: DollarSign },
    { title: "Win Rate", value: "34.8%", change: -2.4, icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, i) => (
        <MetricCard key={metric.title} {...metric} delay={i * 0.1} />
      ))}
    </div>
  );
}
