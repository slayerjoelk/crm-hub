"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3, TrendingUp, Users, Building2, DollarSign,
  ArrowUpRight, ArrowDownRight, Activity
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#64748b"];

function Kpi({ title, value, icon: Icon, trend, suffix = "" }: any) {
  const up = trend >= 0;
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0f1011] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-[#10b981]/[0.12] text-[#10b981] flex items-center justify-center"><Icon className="w-5 h-5" /></div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${up ? "text-[#10b981]" : "text-red-400"}`}>
            {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-[#f7f8f8]">{value}{suffix}</div>
      <div className="text-xs text-[#62666d] mt-0.5">{title}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics").then(r => r.json()).then(r => { setData(r.data ?? null); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const mt = data?.monthlyTrend ?? [];
  const totalRevenue = mt.reduce((s: number, m: any) => s + (m.revenue ?? 0), 0);
  const totalContacts = mt.reduce((s: number, m: any) => s + (m.contacts ?? 0), 0);
  const totalDeals = mt.reduce((s: number, m: any) => s + (m.deals ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f7f8f8]">Analytics</h1>
        <p className="text-[#62666d] text-sm mt-1">Deep insights into your pipeline and contacts</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi title="6-Month Revenue" value={`$${(totalRevenue / 1000).toFixed(0)}k`} icon={DollarSign} trend={12} />
        <Kpi title="New Contacts" value={totalContacts} icon={Users} trend={8} />
        <Kpi title="New Deals" value={totalDeals} icon={BarChart3} trend={-3} />
        <Kpi title="Avg Deal Size" value={totalDeals ? `$${(totalRevenue / totalDeals / 1000).toFixed(0)}k` : "$0k"} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-[#0f1011] p-5">
          <h3 className="text-sm font-semibold text-[#d0d6e0] mb-4">Revenue Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mt}>
                <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: "#475569", fontSize: 12 }} />
                <YAxis stroke="#475569" tick={{ fill: "#475569", fontSize: 12 }} tickFormatter={(v: number) => `$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#e2e8f0" }} formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#0f1011] p-5">
          <h3 className="text-sm font-semibold text-[#d0d6e0] mb-4">Pipeline Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.pipelineDistribution ?? []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                  {(data?.pipelineDistribution ?? []).map((_: any, i: number) => <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#e2e8f0" }} formatter={(value: any, name: any) => [`${value} deals`, name]} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/[0.06] bg-[#0f1011] p-5">
          <h3 className="text-sm font-semibold text-[#d0d6e0] mb-4">Contact Source Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.sourceBreakdown ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: "#475569", fontSize: 12 }} />
                <YAxis stroke="#475569" tick={{ fill: "#475569", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#e2e8f0" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>{(data?.sourceBreakdown ?? []).map((_: any, i: number) => <Cell key={`cb-${i}`} fill={COLORS[i % COLORS.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#0f1011] p-5">
          <h3 className="text-sm font-semibold text-[#d0d6e0] mb-4">Lifecycle Stage Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.lifecycleBreakdown ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: "#475569", fontSize: 12 }} />
                <YAxis stroke="#475569" tick={{ fill: "#475569", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#e2e8f0" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>{(data?.lifecycleBreakdown ?? []).map((_: any, i: number) => <Cell key={`lb-${i}`} fill={COLORS[i % COLORS.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#0f1011] p-5">
        <h3 className="text-sm font-semibold text-[#d0d6e0] mb-4">Top Won Deals</h3>
        <div className="space-y-2">
          {(data?.topDeals ?? []).map((d: any) => (
            <button key={d.id} onClick={() => router.push(`./deals/${d.id}`)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#10b981]/[0.12] text-[#10b981] flex items-center justify-center"><DollarSign className="w-4 h-4" /></div>
                <div className="text-sm font-medium text-[#d0d6e0]">{d.name}</div>
              </div>
              <div className="text-sm font-semibold text-[#10b981]">{d.currency} {d.value?.toLocaleString()}</div>
            </button>
          ))}
          {(!data?.topDeals || data.topDeals.length === 0) && (
            <div className="text-center text-sm text-[#62666d] py-8">No won deals yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
