"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, User, X, Trash2 } from "lucide-react";
import { DataTable } from "@/components/crm/data-table";
import { CsvExportButton } from "@/components/crm/csv-export-button";
import { CustomFieldsSection } from "@/components/crm/custom-fields-section";

function getLifecycleBadge(stage: string) {
  const s = (stage || "").toLowerCase();
  if (s === "subscriber") return { bg: "bg-white/[0.06]", text: "text-[#d0d6e0]", border: "border-transparent" };
  if (s === "lead" || s === "qualified") return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" };
  if (s === "opportunity") return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" };
  if (s === "customer" || s === "champion" || s === "evangelist") return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" };
  return { bg: "bg-white/[0.06]", text: "text-[#8a8f98]", border: "border-transparent" };
}

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName:"",lastName:"",email:"",phone:"",jobTitle:"",lifecycleStage:"subscriber",leadStatus:"new",sourceType:"other",companyId:"" });
  const [error, setError] = useState<string|null>(null);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/contacts", { credentials: "include" }).then(r=>r.json()).then(r=>setContacts(r.data??[]));
    fetch("/api/companies", { credentials: "include" }).then(r=>r.json()).then(r=>setCompanies(r.data??[]));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    const res = await fetch("/api/contacts", { credentials: "include", method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) });
    const json = await res.json().catch(()=>({error:"Unknown"}));
    setSaving(false);
    if (!res.ok) { setError(json.error||"Failed to create contact"); return; }
    setShowModal(false);
    setForm({firstName:"",lastName:"",email:"",phone:"",jobTitle:"",lifecycleStage:"subscriber",leadStatus:"new",sourceType:"other",companyId:""});
    setCustomValues({});
    setContacts(prev=>[json.data,...prev]);
    if (Object.keys(customValues).length > 0) {
      await fetch(`/api/custom-values/contact/${json.data.id}`, { credentials: "include",
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customValues),
      });
    }
  }

  const inputCls = "w-full h-9 px-3 rounded-md bg-[#0f1011] border border-white/[0.06] text-[13px] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/30 transition-all";
  const labelCls = "block text-[11px] font-semibold text-[#8a8f98] uppercase tracking-wider mb-1.5";

  const columns = [
    { key: "name", label: "Name", sortable: false, render: (c: any) => (
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold bg-white/[0.06] text-[#d0d6e0] flex-shrink-0">
          {(c.firstName?.[0]||"")+(c.lastName?.[0]||"")}
        </div>
        <div>
          <div className="text-[13px] font-medium text-[#f7f8f8]">{c.firstName} {c.lastName}</div>
          {c.jobTitle && <div className="text-[11px] text-[#62666d]">{c.jobTitle}</div>}
        </div>
      </div>
    )},
    { key: "email", label: "Email", render: (c: any) => <span className="text-[#d0d6e0]">{c.email}</span> },
    { key: "phone", label: "Phone", render: (c: any) => <span className="text-[#62666d]">{c.phone || "—"}</span> },
    { key: "lifecycleStage", label: "Lifecycle", render: (c: any) => {
      const badge = getLifecycleBadge(c.lifecycleStage);
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
          {c.lifecycleStage}
        </span>
      );
    }},
    { key: "leadStatus", label: "Status", render: (c: any) => <span className="text-[#8a8f98] capitalize">{c.leadStatus?.replace(/_/g, " ")}</span> },
    { key: "sourceType", label: "Source", render: (c: any) => <span className="text-[#8a8f98] capitalize">{c.sourceType}</span> },
    { key: "lastActivityAt", label: "Last Activity", render: (c:any) => c.lastActivityAt ? <span className="text-[#62666d]">{new Date(c.lastActivityAt).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span> : <span className="text-[#62666d]">—</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">Contacts</h1>
          <p className="text-[13px] text-[#62666d] mt-0.5">{contacts.length} people</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvExportButton
            data={contacts.map(c => ({
              id: c.id,
              name: `${c.firstName || ""} ${c.lastName || ""}`.trim(),
              email: c.email || "",
              phone: c.phone || "",
              jobTitle: c.jobTitle || "",
              company: c.companyName || "",
              lifecycleStage: c.lifecycleStage || "",
              leadStatus: c.leadStatus || "",
              sourceType: c.sourceType || "",
              createdAt: c.createdAt ? new Date(c.createdAt).toLocaleString() : "",
            }))}
            filename={`contacts_${new Date().toISOString().slice(0,10)}`}
            columns={[
              { key: "id", label: "ID" }, { key: "name", label: "Name" }, { key: "email", label: "Email" },
              { key: "phone", label: "Phone" }, { key: "jobTitle", label: "Job Title" }, { key: "company", label: "Company" },
              { key: "lifecycleStage", label: "Lifecycle" }, { key: "leadStatus", label: "Lead Status" },
              { key: "sourceType", label: "Source" }, { key: "createdAt", label: "Created" },
            ]}
          />
          <button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-semibold text-[#f7f8f8] bg-[#5e6ad2] hover:bg-[#828fff] transition-colors">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5}/> New Contact
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-[#0f1011]/50 overflow-hidden">
        <DataTable
          columns={columns} data={contacts} rowKey="id"
          onRowClick={(c) => router.push(`./contacts/${c.id}`)}
          bulkActions={[
            { label: "Delete", icon: <Trash2 className="w-3.5 h-3.5" />, action: async (ids) => {
              for (const id of ids) await fetch(`/api/contacts/${id}`, { credentials: "include", method: "DELETE" });
              setContacts(prev => prev.filter(c => !ids.includes(c.id)));
            }, danger: true }
          ]}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={()=>setShowModal(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-[#0f1011] border border-white/[0.08] shadow-[0_24px_48px_rgba(0,0,0,0.4)] m-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-white/[0.06] flex items-center justify-center text-[#d0d6e0]">
                  <User className="w-4 h-4" strokeWidth={1.5}/>
                </div>
                <div>
                  <h2 className="text-[13px] font-semibold text-[#f7f8f8]">New Contact</h2>
                  <p className="text-[11px] text-[#62666d]">Add a new lead or customer</p>
                </div>
              </div>
              <button onClick={()=>setShowModal(false)} className="p-1.5 rounded-md text-[#62666d] hover:text-[#d0d6e0] hover:bg-white/[0.04] transition-colors">
                <X className="w-4 h-4" strokeWidth={1.5}/>
              </button>
            </div>
            <form onSubmit={save} className="p-5 space-y-3.5">
              {error && <div className="rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] px-3 py-2">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>First Name</label><input value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} className={inputCls} placeholder="Jane" /></div>
                <div><label className={labelCls}>Last Name</label><input value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} className={inputCls} placeholder="Doe" /></div>
              </div>
              <div><label className={labelCls}>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className={inputCls} placeholder="jane@example.com" required /></div>
              <div><label className={labelCls}>Phone</label><input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className={inputCls} placeholder="+1 (555) 000-0000" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Lifecycle</label>
                  <select value={form.lifecycleStage} onChange={e=>setForm({...form,lifecycleStage:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["subscriber","lead","qualified","opportunity","customer","champion","evangelist","other"].map(s=><option key={s} value={s} className="bg-[#0f1011]">{s}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Lead Status</label>
                  <select value={form.leadStatus} onChange={e=>setForm({...form,leadStatus:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["new","open","in_progress","open_deal","unqualified","attempted","connected","bad_timing"].map(s=><option key={s} value={s} className="bg-[#0f1011]">{s.replace(/_/g," ")}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Source</label>
                  <select value={form.sourceType} onChange={e=>setForm({...form,sourceType:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["organic","paid","referral","social","email","event","partner","outbound","other"].map(s=><option key={s} value={s} className="bg-[#0f1011]">{s}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Company</label>
                  <select value={form.companyId} onChange={e=>setForm({...form,companyId:e.target.value})} className={`${inputCls} appearance-none`}>
                    <option value="" className="bg-[#0f1011]">None</option>
                    {companies.map((c:any)=><option key={c.id} value={c.id} className="bg-[#0f1011]">{c.name}</option>)}
                  </select>
                </div>
              </div>
              <CustomFieldsSection entityType="contact" mode="form" onChange={setCustomValues} />
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={()=>setShowModal(false)} className="h-8 px-4 rounded-md text-[12px] font-medium text-[#d0d6e0] border border-white/[0.06] hover:bg-white/[0.04] transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-8 px-4 rounded-md text-[12px] font-semibold text-[#f7f8f8] bg-[#5e6ad2] hover:bg-[#828fff] transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
