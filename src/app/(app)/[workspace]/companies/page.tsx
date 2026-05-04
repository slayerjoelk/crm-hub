"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Plus, MoreHorizontal, Building2, Globe, X } from "lucide-react";

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", domain: "", industry: "", type: "prospect", size: "", lifecycleStage: "subscriber" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/companies?q=${encodeURIComponent(search)}`).then(r => r.json()).then(r => setCompanies(r.data ?? []));
  }, [search]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    const res = await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json().catch(() => ({ error: "Unknown" }));
    setSaving(false);
    if (!res.ok) { setError(json.error || "Failed to create company"); return; }
    setShowModal(false);
    setForm({ name: "", domain: "", industry: "", type: "prospect", size: "", lifecycleStage: "subscriber" });
    setCompanies(prev => [json.data, ...prev]);
  }

  const formatCurrency = (n: number | null) => n ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n) : "-";
  const inputCls = "w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Companies</h1><p className="text-slate-500 text-sm mt-1">Manage your accounts and organizations</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors">
          <Plus className="w-4 h-4" /> New Company
        </button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
        </div>
        <button className="h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-sm flex items-center gap-2 hover:bg-slate-800"><Filter className="w-4 h-4" /> Filters</button>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-800/40">
              <tr>{["Name","Domain","Industry","Type","Lifecycle","Revenue","Size","Last Contacted",""].map((h,i) => <th key={i} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {companies.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/30 cursor-pointer transition-colors" onClick={() => router.push(`./companies/${c.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Building2 className="w-4 h-4" /></div>
                      <div><div className="font-medium text-slate-200">{c.name}</div><div className="text-xs text-slate-500">{c.city ?? "-"}{c.country ? `, ${c.country}` : ""}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{c.domain ? <div className="flex items-center gap-1.5 text-slate-400"><Globe className="w-3.5 h-3.5 text-slate-500" /><span>{c.domain}</span></div> : "-"}</td>
                  <td className="px-4 py-3 text-slate-400">{c.industry ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{c.type ?? "-"}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">{c.lifecycleStage}</span></td>
                  <td className="px-4 py-3 text-slate-400">{formatCurrency(c.annualRevenue)}</td>
                  <td className="px-4 py-3 text-slate-400">{c.size ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500">{c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3"><button className="p-1 rounded hover:bg-slate-800 text-slate-500"><MoreHorizontal className="w-4 h-4" /></button></td>
                </tr>
              ))}
              {companies.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-600">No companies found. <button onClick={() => setShowModal(true)} className="mt-1 text-sm text-emerald-400 hover:underline inline">Create your first company</button></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Building2 className="w-4 h-4"/></div>
                <div><h2 className="text-sm font-semibold text-white">New Company</h2><p className="text-xs text-slate-500">Add an organization</p></div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2">{error}</div>}
              <div><label className={labelCls}>Company name *</label><input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className={inputCls} placeholder="Acme Corp" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Domain</label><input value={form.domain} onChange={e=>setForm({...form, domain:e.target.value})} className={inputCls} placeholder="acme.com" /></div>
                <div><label className={labelCls}>Industry</label><input value={form.industry} onChange={e=>setForm({...form, industry:e.target.value})} className={inputCls} placeholder="SaaS" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Type</label>
                  <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["prospect","partner","reseller","vendor","other"].map(s=> <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Size</label>
                  <select value={form.size} onChange={e=>setForm({...form, size:e.target.value})} className={`${inputCls} appearance-none`}>
                    <option value="" className="bg-slate-900">-- Select --</option>
                    {["1-10","11-50","51-200","201-500","501-1000","1000+"].map(s=> <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className={labelCls}>Lifecycle stage</label>
                <select value={form.lifecycleStage} onChange={e=>setForm({...form, lifecycleStage:e.target.value})} className={`${inputCls} appearance-none`}>
                  {["subscriber","lead","qualified","opportunity","customer","champion","evangelist","other"].map(s=> <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                </select>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 px-4 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>} Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
