"use client";

import { useEffect, useState } from "react";
import { Users, Building2, BarChart3, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

function KpiCard({ title, value, icon: Icon, trend, trendLabel, color }: any) {
  const up = trend >= 0;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor: color + "15"}}>
          <Icon className="w-5 h-5" style={{color}} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
          {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-100">{value}</div>
        <div className="text-sm text-slate-500 mt-0.5">{title}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/dashboard").then(r => r.json()).then(json => setData(json)); }, []);

  const pipelineColors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
  const chartData = data?.monthlyRevenue ?? [];
  const pipelineData = data?.pipelineDistribution ?? [{ name: "No data", value: 1 }];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Dashboard</h1><p className="text-slate-500 text-sm mt-1">Overview of your CRM</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Contacts" value={data?.stats?.contacts ?? "-"} icon={Users} trend={12} color="#3b82f6" />
        <KpiCard title="Companies" value={data?.stats?.companies ?? "-"} icon={Building2} trend={8} color="#8b5cf6" />
        <KpiCard title="Deals" value={data?.stats?.deals ?? "-"} icon={BarChart3} trend={-3} color="#f59e0b" />
        <KpiCard title="Revenue (Closed)" value={data ? "$" + (data.stats?.revenueWon ?? 0).toLocaleString() : "-"} icon={DollarSign} trend={24} color="#10b981" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Revenue Overview</h3>
            <div className="text-xs text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5"/>+18% this month</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" tick={{fill:"#475569",fontSize:12}} />
                <YAxis stroke="#475569" tick={{fill:"#475569",fontSize:12}} tickFormatter={(v: number) => "$"+(v/1000).toFixed(0)+"k"} />
                <Tooltip contentStyle={{backgroundColor:"#0f172a",border:"1px solid #1e293b",borderRadius:"8px",color:"#e2e8f0"}} formatter={(value: any) => [`$${value?.toLocaleString?.() ?? value}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Pipeline Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                  {pipelineData.map((_: any, i: number) => <Cell key={`cell-${i}`} fill={pipelineColors[i % pipelineColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{backgroundColor:"#0f172a",border:"1px solid #1e293b",borderRadius:"8px",color:"#e2e8f0"}} formatter={(value: any) => [`$${value?.toLocaleString?.() ?? value}`, ""]} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize: 12, color: '#94a3b8'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Recent Deals</h3>
          <div className="space-y-3">
            {(data?.deals ?? []).slice(0,10).map((deal: any) => (
              <div key={deal.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <div>
                  <div className="text-sm font-medium text-slate-200">{deal.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{deal.value ? "$"+deal.value.toLocaleString() : "-"} — {deal.status}</div>
                </div>
                {deal.expectedCloseDate && <div className="text-xs text-slate-600 flex items-center gap-1"><Calendar className="w-3 h-3"/>{new Date(deal.expectedCloseDate).toLocaleDateString()}</div>}
              </div>
            ))}
            {(!data?.deals || data.deals.length === 0) && <div className="text-center text-sm text-slate-600 py-8">No deals yet. Create one to get started.</div>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {(data?.activities ?? []).slice(0,10).map((act: any) => (
              <div key={act.id} className="flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <div className="text-sm text-slate-200">{act.body}</div>
                  <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3"/>{act.createdAt ? new Date(act.createdAt).toLocaleDateString() : "-"}</div>
                </div>
              </div>
            ))}
            {(!data?.activities || data.activities.length === 0) && <div className="text-center text-sm text-slate-600 py-8">No activity yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
