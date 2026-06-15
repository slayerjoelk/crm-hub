"use client";

import { AppShell } from "@/components/crm/premium-app-shell";
import { DashboardMetrics } from "@/components/crm/dashboard-metrics";
import { motion } from "framer-motion";
import { TrendingUp, Users, DollarSign, Target } from "lucide-react";

export default function DashboardPage() {
  return (
    <AppShell workspaceName="Workspace" userName="User" userRole="admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-[#f7f8f8]">Dashboard</h1>
            <p className="text-[#8a8f98] text-sm mt-1">Overview of your CRM performance</p>
          </div>
        </div>

        {/* Metrics */}
        <DashboardMetrics />

        {/* Recent Activity & Deals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Deals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0f1011] border border-white/[0.06] rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#f7f8f8] font-medium">Recent Deals</h2>
              <a href="/deals" className="text-[#5e6ad2] text-sm font-medium hover:text-[#828fff]">View all →</a>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#191a1b]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#5e6ad2]/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-[#5e6ad2]" />
                    </div>
                    <div>
                      <p className="text-[#f7f8f8] text-sm font-medium">Deal {i}</p>
                      <p className="text-[#8a8f98] text-xs">Company {i}</p>
                    </div>
                  </div>
                  <span className="text-[#10b981] text-sm font-medium">$5,000</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0f1011] border border-white/[0.06] rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#f7f8f8] font-medium">Today's Tasks</h2>
              <a href="/tasks" className="text-[#5e6ad2] text-sm font-medium hover:text-[#828fff]">View all →</a>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#191a1b]">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/[0.06] bg-[#0f1011] text-[#5e6ad2]" />
                  <div className="flex-1">
                    <p className="text-[#f7f8f8] text-sm">Task {i}</p>
                    <p className="text-[#8a8f98] text-xs">Due today</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-medium">High</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Performance Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0f1011] border border-white/[0.06] rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[#f7f8f8] font-medium">Performance Trends</h2>
            <select className="h-9 px-3 rounded-lg bg-[#191a1b] border border-white/[0.06] text-[#d0d6e0] text-sm">
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Last year</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-[#62666d] mx-auto mb-3" />
              <p className="text-[#8a8f98] text-sm">Chart coming soon</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
