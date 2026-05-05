"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, X } from "lucide-react";
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

  useEffect(() => { fetch("/api/companies").then(r=>r.json()).then(r=>setCompanies(r.data??[])); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    const body: any = { ...form };
    if (body.employeeCount) body.employeeCount = parseInt(body.employeeCount);
    if (body.annualRevenue) body.annualRevenue = parseFloat(body.annualRevenue);
    const res = await fetch("/api/companies", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
    const json = await res.json().catch(()=>({error:"Unknown"}));
    setSaving(false);
    if (!res.ok) { setError(json.error||"Failed"); return; }
    setShowModal(false);
    setForm({name:"",domain:"",industry:"",employeeCount:"",annualRevenue:"",website:""});
    setCustomValues({});
    if (json.data?.id && Object.keys(customValues).length > 0) {
      await fetch(`/api/custom-values/company/${json.data.id}`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify(customValues),
      });
    }
    setCompanies(prev=>[json.data,...prev]);
  }

  const inputCls = "w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/60";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1";

  const columns = [
    { key: "name", label: "Company", render: (c:any)=><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0"><Building2 className="w-3.5 h-3.5"/></div><span className="font-medium text-slate-200">{c.name}</span></div> },
    { key: "domain", label: "Domain" },
    { key: "industry", label: "Industry" },
    { key: "employeeCount", label: "Employees", render: (c:any)=>c.employeeCount||<span className="text-slate-600">-</span> },
    { key: "annualRevenue", label: "Revenue", render: (c:any)=>c.annualRevenue ? "$$"+c.annualRevenue.toLocaleString() : <span className="text-slate-600">-</span> },
    { key: "website", label: "Website", render: (c:any)=>c.website ? <a href={c.website} onClick={e=>e.stopPropagation()} className="text-sky-400 hover:underline text-xs truncate max-w-[120px] block">{c.website}</a> : <span className="text-slate-600">-</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Companies</h1><p className="text-slate-500 text-sm mt-1">Organizations you do business with</p></div>
        <div className="flex items-center gap-2">
          <CsvExportButton
            data={companies.map(c => ({
              id: c.id,
              name: c.name || "",
              domain: c.domain || "",
              industry: c.industry || "",
              size: c.size || "",
              type: c.type || "",
              city: c.city || "",
              country: c.country || "",
              phone: c.phone || "",
              email: c.email || "",
              createdAt: c.createdAt ? new Date(c.createdAt).toLocaleString() : "",
            }))}
            filename={`companies_${new Date().toISOString().slice(0,10)}`}
            columns={[
              { key: "id", label: "ID" },
              { key: "name", label: "Company" },
              { key: "domain", label: "Domain" },
              { key: "industry", label: "Industry" },
              { key: "size", label: "Size" },
              { key: "type", label: "Type" },
              { key: "city", label: "City" },
              { key: "country", label: "Country" },
              { key: "phone", label: "Phone" },
              { key: "email", label: "Email" },
              { key: "createdAt", label: "Created" },
            ]}
          />
          <button onClick={()=>setShowModal(true)} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500"><Plus className="w-4 h-4"/> New Company</button>
        </div>
      </div>
      <DataTable columns={columns} data={companies} rowKey="id" onRowClick={(c)=>router.push(`./companies/${c.id}`)} />
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={()=>setShowModal(false)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl m-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Building2 className="w-4 h-4"/></div><div><h2 className="text-sm font-semibold text-white">New Company</h2><p className="text-xs text-slate-500">Add a new account</p></div></div>
              <button onClick={()=>setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2">{error}</div>}
              <div><label className={labelCls}>Company name *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inputCls} placeholder="Acme Inc" required /></div>
              <div><label className={labelCls}>Domain</label><input value={form.domain} onChange={e=>setForm({...form,domain:e.target.value})} className={inputCls} placeholder="acme.com" /></div>
              <div><label className={labelCls}>Industry</label><input value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})} className={inputCls} placeholder="Software" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Employees</label><input type="number" value={form.employeeCount} onChange={e=>setForm({...form,employeeCount:e.target.value})} className={inputCls} placeholder="50" /></div>
                <div><label className={labelCls}>Revenue</label><input type="number" value={form.annualRevenue} onChange={e=>setForm({...form,annualRevenue:e.target.value})} className={inputCls} placeholder="1000000" /></div>
              </div>
              <div><label className={labelCls}>Website</label><input type="url" value={form.website} onChange={e=>setForm({...form,website:e.target.value})} className={inputCls} placeholder="https://acme.com" /></div>
              <CustomFieldsSection entityType="company" mode="form" onChange={setCustomValues} />
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
