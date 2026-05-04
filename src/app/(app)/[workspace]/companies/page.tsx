"use client";

import { useEffect, useState } from "react";
import { Search, Filter, Plus, MoreHorizontal, Building2, Globe } from "lucide-react";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/companies?q=${encodeURIComponent(search)}`).then(r => r.json()).then(r => setCompanies(r.data ?? []));
  }, [search]);

  const formatCurrency = (n: number | null) => {
    if (!n) return "-";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Companies</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your accounts and organizations</p>
        </div>
        <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors">
          <Plus className="w-4 h-4" /> New Company
        </button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        </div>
        <button className="h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-sm flex items-center gap-2 hover:bg-slate-800">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-800/40">
              <tr>
                {["Name","Domain","Industry","Type","Lifecycle","Revenue","Size","Last Contacted",""].map((h,i) => (
                  <th key={i} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {companies.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-200">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.city ?? "-"}{c.country ? `, ${c.country}` : ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.domain ? (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                        <span>{c.domain}</span>
                      </div>
                    ) : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{c.industry ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{c.type ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                      {c.lifecycleStage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatCurrency(c.annualRevenue)}</td>
                  <td className="px-4 py-3 text-slate-400">{c.size ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 rounded hover:bg-slate-800 text-slate-500">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-600">
                    No companies found.
                    <button className="mt-1 text-sm text-emerald-400 hover:underline inline">Create your first company</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
