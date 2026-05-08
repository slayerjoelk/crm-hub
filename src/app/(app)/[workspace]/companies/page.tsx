"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, X, Globe, Users, Trash2 } from "lucide-react";
import { DataTable } from "@/components/crm/data-table";
import { CsvExportButton } from "@/components/crm/csv-export-button";
import { CustomFieldsSection } from "@/components/crm/custom-fields-section";

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:"", domain:"", industry:"", employeeCount:"", annualRevenue:"", website:"" });
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string|null>(null);

  useEffect(() => { fetch("/api/companies", { credentials: "include" }).then(r=>r.json()).then(r=>setCompanies(r.data??[])); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    const body: any = { ...form };
    if (body.employeeCount) body.employeeCount = parseInt(body.employeeCount);
    if (body.annualRevenue) body.annualRevenue = parseFloat(body.annualRevenue);
    const res = await fetch("/api/companies", { credentials: "include", method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
    const json = await res.json().catch(()=>({error:"Unknown"}));
    setSaving(false);
    if (!res.ok) { setError(json.error||"Failed"); return; }
    setShowModal(false);
    setForm({name:"",domain:"",industry:"",employeeCount:"",annualRevenue:"",website:""});
    setCustomValues({});
    if (json.data?.id && Object.keys(customValues).length > 0) {
      await fetch(`/api/custom-values/company/${json.data.id}`, { credentials: "include",
        method: "POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(customValues),
      });
    }
    setCompanies(prev=>[json.data,...prev]);
  }

  const inputCls = "w-full h-9 px-3 rounded-md bg-[#0f1011] border border-white/[0.06] text-[13px] text-[#d0d6e0] placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/30 transition-all";
  const labelCls = "block text-[11px] font-semibold text-[#8a8f98] uppercase tracking-wider mb-1.5";

  const columns = [
    { key: "name", label: "Company", render: (c:any)=><div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-md bg-white/[0.06] flex items-center justify-center text-[#d0d6e0] shrink-0">
        <Building2 className="w-3.5 h-3.5" strokeWidth={1.5}/>
      </div>
      <span className="text-[13px] font-medium text-[#f7f8f8]">{c.name}</span>
    </div> },
    { key: "domain", label: "Domain", render: (c:any) => <span className="text-[#8a8f98] font-mono text-[12px]">{c.domain || "—"}</span> },
    { key: "industry", label: "Industry", render: (c:any) => <span className="text-[#d0d6e0]">{c.industry || "—"}</span> },
    { key: "employeeCount", label: "Size", render: (c:any)=>c.employeeCount ? <span className="inline-flex items-center gap-1 text-[11px] text-[#8a8f98]"><Users className="w-3 h-3"/>{c.employeeCount.toLocaleString()}</span> : <span className="text-[#62666d]">—</span> },
    { key: "annualRevenue", label: "Revenue", render: (c:any)=>c.annualRevenue ? <span className="text-[#d0d6e0] font-mono text-[12px]">${c.annualRevenue.toLocaleString()}</span> : <span className="text-[#62666d]">—</span> },
    { key: "website", label: "Website", render: (c:any)=>c.website ? <a href={c.website} onClick={e=>e.stopPropagation()} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[#5e6ad2] hover:text-[#828fff] text-[11px] truncate max-w-[140px] transition-colors"><Globe className="w-3 h-3"/>{c.website.replace(/^https?:\/\//, "").slice(0,30)}</a> : <span className="text-[#62666d]">—</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#f7f8f8] tracking-tight">Companies</h1>
          <p className="text-[13px] text-[#62666d] mt-0.5">{companies.length} organizations</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvExportButton
            data={companies.map(c => ({
              id: c.id, name: c.name || "", domain: c.domain || "", industry: c.industry || "",
              size: c.size || "", type: c.type || "", city: c.city || "", country: c.country || "",
              phone: c.phone || "", email: c.email || "",
              createdAt: c.createdAt ? new Date(c.createdAt).toLocaleString() : "",
            }))}
            filename={`companies_${new Date().toISOString().slice(0,10)}`}
            columns={[
              { key: "id", label: "ID" }, { key: "name", label: "Company" }, { key: "domain", label: "Domain" },
              { key: "industry", label: "Industry" }, { key: "size", label: "Size" }, { key: "type", label: "Type" },
              { key: "city", label: "City" }, { key: "country", label: "Country" },
              { key: "phone", label: "Phone" }, { key: "email", label: "Email" }, { key: "createdAt", label: "Created" },
            ]}
          />
          <button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-semibold text-[#f7f8f8] bg-[#5e6ad2] hover:bg-[#828fff] transition-colors">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5}/> New Company
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-[#0f1011]/50 overflow-hidden">
        <DataTable columns={columns} data={companies} rowKey="id" onRowClick={(c)=>router.push(`./companies/${c.id}`)}
          bulkActions={[
            { label: "Delete", icon: <Trash2 className="w-3.5 h-3.5" />, action: async (ids) => {
              for (const id of ids) await fetch(`/api/companies/${id}`, { credentials: "include", method: "DELETE" });
              setCompanies(prev => prev.filter(c => !ids.includes(c.id)));
            }, danger: true }
          ]}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={()=>setShowModal(false)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-[#0f1011] border border-white/[0.08] shadow-[0_24px_48px_rgba(0,0,0,0.4)] m-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-white/[0.06] flex items-center justify-center text-[#d0d6e0]"><Building2 className="w-4 h-4" strokeWidth={1.5}/></div>
                <div>
                  <h2 className="text-[13px] font-semibold text-[#f7f8f8]">New Company</h2>
                  <p className="text-[11px] text-[#62666d]">Add a new account</p>
                </div>
              </div>
              <button onClick={()=>setShowModal(false)} className="p-1.5 rounded-md text-[#62666d] hover:text-[#d0d6e0] hover:bg-white/[0.04] transition-colors">
                <X className="w-4 h-4" strokeWidth={1.5}/>
              </button>
            </div>
            <form onSubmit={save} className="p-5 space-y-3.5">
              {error && <div className="rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] px-3 py-2">{error}</div>}
              <div><label className={labelCls}>Company Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inputCls} placeholder="Acme Inc" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Domain</label><input value={form.domain} onChange={e=>setForm({...form,domain:e.target.value})} className={inputCls} placeholder="acme.com" /></div>
                <div><label className={labelCls}>Industry</label><input value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})} className={inputCls} placeholder="Software" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Employees</label><input type="number" value={form.employeeCount} onChange={e=>setForm({...form,employeeCount:e.target.value})} className={inputCls} placeholder="50" /></div>
                <div><label className={labelCls}>Revenue (USD)</label><input type="number" value={form.annualRevenue} onChange={e=>setForm({...form,annualRevenue:e.target.value})} className={inputCls} placeholder="1000000" /></div>
              </div>
              <div><label className={labelCls}>Website</label><input type="url" value={form.website} onChange={e=>setForm({...form,website:e.target.value})} className={inputCls} placeholder="https://acme.com" /></div>
              <CustomFieldsSection entityType="company" mode="form" onChange={setCustomValues} />
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
