"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, User, X } from "lucide-react";
import { DataTable } from "@/components/crm/data-table";

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName:"",lastName:"",email:"",phone:"",jobTitle:"",lifecycleStage:"subscriber",leadStatus:"new",sourceType:"other",companyId:"" });
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    fetch("/api/contacts").then(r=>r.json()).then(r=>setContacts(r.data??[]));
    fetch("/api/companies").then(r=>r.json()).then(r=>setCompanies(r.data??[]));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    const res = await fetch("/api/contacts", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) });
    const json = await res.json().catch(()=>({error:"Unknown"}));
    setSaving(false);
    if (!res.ok) { setError(json.error||"Failed to create contact"); return; }
    setShowModal(false);
    setForm({firstName:"",lastName:"",email:"",phone:"",jobTitle:"",lifecycleStage:"subscriber",leadStatus:"new",sourceType:"other",companyId:""});
    setContacts(prev=>[json.data,...prev]);
  }

  const inputCls = "w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1";

  const columns = [
    { key: "name", label: "Name", sortable: false, render: (c: any) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-semibold flex-shrink-0">{(c.firstName?.[0]||"")+(c.lastName?.[0]||"")}</div>
        <div><div className="font-medium text-slate-200">{c.firstName} {c.lastName}</div>{c.jobTitle && <div className="text-xs text-slate-500">{c.jobTitle}</div>}</div>
      </div>
    )},
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "lifecycleStage", label: "Lifecycle", render: (c: any) => <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">{c.lifecycleStage}</span> },
    { key: "leadStatus", label: "Status" },
    { key: "sourceType", label: "Source" },
    { key: "lastActivityAt", label: "Last Activity", render: (c:any) => c.lastActivityAt ? new Date(c.lastActivityAt).toLocaleDateString() : <span className="text-slate-600">-</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Contacts</h1><p className="text-slate-500 text-sm mt-1">Manage your leads and customers</p></div>
        <button onClick={()=>setShowModal(true)} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500"><Plus className="w-4 h-4"/> New Contact</button>
      </div>

      <DataTable
        columns={columns} data={contacts} rowKey="id"
        onRowClick={(c) => router.push(`./contacts/${c.id}`)}
        bulkActions={[
          { label: "Delete", icon: <span className="text-red-400">🗑</span>, action: async (ids) => {
            for (const id of ids) await fetch(`/api/contacts/${id}`, { method: "DELETE" });
            setContacts(prev => prev.filter(c => !ids.includes(c.id)));
          }, danger: true }
        ]}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={()=>setShowModal(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl m-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><User className="w-4 h-4"/></div><div><h2 className="text-sm font-semibold text-white">New Contact</h2><p className="text-xs text-slate-500">Add a new lead or customer</p></div></div>
              <button onClick={()=>setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>First name</label><input value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} className={inputCls} /></div>
                <div><label className={labelCls}>Last name</label><input value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Email *</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className={inputCls} placeholder="john@example.com" required /></div>
              <div><label className={labelCls}>Phone</label><input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Lifecycle stage</label>
                  <select value={form.lifecycleStage} onChange={e=>setForm({...form,lifecycleStage:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["subscriber","lead","qualified","opportunity","customer","champion","evangelist","other"].map(s=><option key={s} value={s} className="bg-slate-900">{s}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Lead status</label>
                  <select value={form.leadStatus} onChange={e=>setForm({...form,leadStatus:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["new","open","in_progress","open_deal","unqualified","attempted","connected","bad_timing"].map(s=><option key={s} value={s} className="bg-slate-900">{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className={labelCls}>Source type</label>
                <select value={form.sourceType} onChange={e=>setForm({...form,sourceType:e.target.value})} className={`${inputCls} appearance-none`}>
                  {["organic","paid","referral","social","email","event","partner","outbound","other"].map(s=><option key={s} value={s} className="bg-slate-900">{s}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Company</label>
                <select value={form.companyId} onChange={e=>setForm({...form,companyId:e.target.value})} className={`${inputCls} appearance-none`}>
                  <option value="" className="bg-slate-900">-- None --</option>
                  {companies.map((c:any)=><option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
                </select>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={()=>setShowModal(false)} className="h-9 px-4 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2">{saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>} Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
