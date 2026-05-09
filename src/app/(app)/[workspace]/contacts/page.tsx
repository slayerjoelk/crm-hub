"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, User, X, Trash2 } from "lucide-react";
import { DataTable } from "@/components/crm/data-table";
import { CsvExportButton } from "@/components/crm/csv-export-button";
import { CustomFieldsSection } from "@/components/crm/custom-fields-section";

function getLifecycleBadge(stage: string) {
  const s = (stage || "").toLowerCase();
  if (s === "subscriber") return { bg: "bg-zinc-800/40", text: "text-zinc-300", border: "border-transparent" };
  if (s === "lead" || s === "qualified") return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" };
  if (s === "opportunity") return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" };
  if (s === "customer" || s === "champion" || s === "evangelist") return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" };
  return { bg: "bg-zinc-800/40", text: "text-zinc-400", border: "border-transparent" };
}

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ firstName:"",lastName:"",email:"",phone:"",jobTitle:"",lifecycleStage:"subscriber",leadStatus:"new",sourceType:"other",companyId:"" });
  const [error, setError] = useState<string|null>(null);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/contacts", { credentials: "include" }).then(r=>r.json()),
      fetch("/api/companies", { credentials: "include" }).then(r=>r.json()),
      fetch("/api/sequences/enrollments", { credentials: "include" }).then(r=>r.json()),
      fetch("/api/sequences", { credentials: "include" }).then(r=>r.json()),
    ]).then(([contactsR, companiesR, enrollmentsR, sequencesR]) => {
      setContacts(contactsR.data??[]);
      setCompanies(companiesR.data??[]);
      setEnrollments(enrollmentsR.data??[]);
      setSequences(sequencesR.data??[]);
      setLoading(false);
    });
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

  function getEnrollment(contactId: string) {
    return enrollments.find((e: any) => e.contactId === contactId);
  }

  function getSequenceName(sequenceId: string) {
    return sequences.find((s: any) => s.id === sequenceId)?.name || "Unknown";
  }

  const inputCls = "w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10 transition-all";
  const labelCls = "text-xs font-medium text-zinc-400 mb-1.5 block";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const columns = [
    { key: "name", label: "Name", sortable: false, render: (c: any) => (
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold bg-zinc-800/60 text-zinc-300 flex-shrink-0">
          {(c.firstName?.[0]||"")+(c.lastName?.[0]||"")}
        </div>
        <div>
          <div className="text-[13px] font-medium text-white">{c.firstName} {c.lastName}</div>
          {c.jobTitle && <div className="text-[11px] text-zinc-500">{c.jobTitle}</div>}
        </div>
      </div>
    )},
    { key: "email", label: "Email", render: (c: any) => <span className="text-zinc-300">{c.email}</span> },
    { key: "phone", label: "Phone", render: (c: any) => <span className="text-zinc-500">{c.phone || "—"}</span> },
    { key: "sequenceEnrollment", label: "Sequence", render: (c: any) => {
      const enr = getEnrollment(c.id);
      if (!enr) return <span className="text-zinc-500 text-xs">Not enrolled</span>;
      const seqName = getSequenceName(enr.sequenceId);
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-violet-400">{seqName}</span>
          <span className="text-[10px] text-zinc-500">Step {enr.currentStep} · {enr.status}</span>
        </div>
      );
    }},
    { key: "lifecycleStage", label: "Lifecycle", render: (c: any) => {
      const badge = getLifecycleBadge(c.lifecycleStage);
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
          {c.lifecycleStage}
        </span>
      );
    }},
    { key: "leadStatus", label: "Status", render: (c: any) => <span className="text-zinc-400 capitalize text-xs">{c.leadStatus?.replace(/_/g, " ")}</span> },
    { key: "sourceType", label: "Source", render: (c: any) => <span className="text-zinc-400 capitalize text-xs">{c.sourceType}</span> },
    { key: "lastActivityAt", label: "Last Activity", render: (c:any) => c.lastActivityAt ? <span className="text-zinc-500 text-xs">{new Date(c.lastActivityAt).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span> : <span className="text-zinc-500 text-xs">—</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Contacts</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{contacts.length} people</p>
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
          <button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/20">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5}/> New Contact
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 overflow-hidden">
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

      {contacts.length === 0 && !loading && (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-12 text-center">
          <User className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-1">No contacts yet</h3>
          <p className="text-sm text-zinc-500 mb-6">Add your first contact to get started.</p>
          <button onClick={()=>setShowModal(true)} className="h-9 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 transition-all">
            Add Contact
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={()=>setShowModal(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-900/95 border border-zinc-700/80 shadow-[0_24px_48px_rgba(0,0,0,0.5)] m-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-zinc-800/60 flex items-center justify-center text-zinc-300">
                  <User className="w-4 h-4" strokeWidth={1.5}/>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">New Contact</h2>
                  <p className="text-xs text-zinc-500">Add a new lead or customer</p>
                </div>
              </div>
              <button onClick={()=>setShowModal(false)} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/40 transition-colors">
                <X className="w-4 h-4" strokeWidth={1.5}/>
              </button>
            </div>
            <form onSubmit={save} className="p-5 space-y-3.5">
              {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>First Name</label><input value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} className={inputCls} placeholder="Jane" /></div>
                <div><label className={labelCls}>Last Name</label><input value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} className={inputCls} placeholder="Doe" /></div>
              </div>
              <div><label className={labelCls}>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className={inputCls} placeholder="jane@example.com" required /></div>
              <div><label className={labelCls}>Phone</label><input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className={inputCls} placeholder="+1 (555) 000-0000" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Lifecycle</label>
                  <select value={form.lifecycleStage} onChange={e=>setForm({...form,lifecycleStage:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["subscriber","lead","qualified","opportunity","customer","champion","evangelist","other"].map(s=><option key={s} value={s} className="bg-zinc-900">{s}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Lead Status</label>
                  <select value={form.leadStatus} onChange={e=>setForm({...form,leadStatus:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["new","open","in_progress","open_deal","unqualified","attempted","connected","bad_timing"].map(s=><option key={s} value={s} className="bg-zinc-900">{s.replace(/_/g," ")}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Source</label>
                  <select value={form.sourceType} onChange={e=>setForm({...form,sourceType:e.target.value})} className={`${inputCls} appearance-none`}>
                    {["organic","paid","referral","social","email","event","partner","outbound","other"].map(s=><option key={s} value={s} className="bg-zinc-900">{s}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Company</label>
                  <select value={form.companyId} onChange={e=>setForm({...form,companyId:e.target.value})} className={`${inputCls} appearance-none`}>
                    <option value="" className="bg-zinc-900">None</option>
                    {companies.map((c:any)=><option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>)}
                  </select>
                </div>
              </div>
              <CustomFieldsSection entityType="contact" mode="form" onChange={setCustomValues} />
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={()=>setShowModal(false)} className="h-9 px-4 rounded-xl text-sm font-medium text-zinc-300 border border-zinc-700/80 hover:bg-zinc-800/40 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="h-9 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-violet-500/20">
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
