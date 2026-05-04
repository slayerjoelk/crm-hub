"use client";

import { useEffect, useState } from "react";
import { Search, Filter, Plus, MoreHorizontal, X, Building2, User } from "lucide-react";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    jobTitle: "", lifecycleStage: "subscriber", leadStatus: "new", sourceType: "other", companyId: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/contacts?q=${encodeURIComponent(search)}`).then(r => r.json()).then(r => setContacts(r.data ?? []));
  }, [search]);

  useEffect(() => {
    fetch("/api/companies").then(r => r.json()).then(r => setCompanies(r.data ?? []));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const res = await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json().catch(() => ({ error: "Unknown" }));
    setSaving(false);
    if (!res.ok) { setError(json.error || "Failed to create contact"); return; }
    setShowModal(false);
    setForm({ firstName: "", lastName: "", email: "", phone: "", jobTitle: "", lifecycleStage: "subscriber", leadStatus: "new", sourceType: "other", companyId: "" });
    setContacts(prev => [json.data, ...prev]);
  }

  const inputCls = "w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Contacts</h1><p className="text-slate-500 text-sm mt-1">Manage your leads and customers</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors">
          <Plus className="w-4 h-4" /> New Contact
        </button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
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
                {["Name","Email","Phone","Lifecycle","Lead Status","Last Activity",""].map((h,i) => <th key={i} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {contacts.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => router.push(`./contacts/${c.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-semibold">
                        {(c.firstName?.[0] ?? "") + (c.lastName?.[0] ?? "")}
                      </div>
                      <div><div className="font-medium text-slate-200">{c.firstName} {c.lastName}</div><div className="text-xs text-slate-500">{c.jobTitle ?? "-"}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{c.email ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-400">{c.phone ?? "-"}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">{c.lifecycleStage}</span></td>
                  <td className="px-4 py-3 text-slate-400">{c.leadStatus}</td>
                  <td className="px-4 py-3 text-slate-500">{c.lastActivityAt ? new Date(c.lastActivityAt).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3"><button className="p-1 rounded hover:bg-slate-800 text-slate-500"><MoreHorizontal className="w-4 h-4"/></button></td>
                </tr>
              ))}
              {contacts.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-600">No contacts found. <button onClick={() => setShowModal(true)} className="mt-1 text-sm text-emerald-400 hover:underline inline">Create your first contact</button></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><User className="w-4 h-4"/></div>
                <div><h2 className="text-sm font-semibold text-white">New Contact</h2><p className="text-xs text-slate-500">Add a new lead or customer</p></div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>First name</label><input value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} className={inputCls} placeholder="Jane" required /></div>
                <div><label className={labelCls}>Last name</label><input value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} className={inputCls} placeholder="Smith" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className={inputCls} placeholder="jane@example.com" /></div>
                <div><label className={labelCls}>Phone</label><input type="tel" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} className={inputCls} placeholder="+27 82 555 0123" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Job title</label><input value={form.jobTitle} onChange={e=>setForm({...form, jobTitle:e.target.value})} className={inputCls} placeholder="Head of Sales" /></div>
                <div><label className={labelCls}>Company</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <select value={form.companyId} onChange={e=>setForm({...form, companyId:e.target.value})} className={`${inputCls} pl-9 appearance-none`}>
                      <option value="" className="bg-slate-900">-- No company --</option>
                      {companies.map((co: any) => <option key={co.id} value={co.id} className="bg-slate-900">{co.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={labelCls}>Lifecycle</label>
                  <select value={form.lifecycleStage} onChange={e=>setForm({...form, lifecycleStage:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["subscriber","lead","qualified","opportunity","customer","champion","evangelist","other"].map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Lead status</label>
                  <select value={form.leadStatus} onChange={e=>setForm({...form, leadStatus:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["new","open","in_progress","open_deal","unqualified","attempted","connected","bad_timing"].map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Source</label>
                  <select value={form.sourceType} onChange={e=>setForm({...form, sourceType:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["organic","paid","referral","social","email","event","partner","outbound","other"].map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 px-4 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                  Create Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
